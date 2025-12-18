/* =========================================
COMPLETE SCHEMA UPDATE - CUSTOMER + SELLER
========================================= */

-- Enable password hashing extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO public;

-- -----------------------------------------
-- 1. UPDATE SELLERS TABLE
-- -----------------------------------------
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS seller_id INTEGER,
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS storename VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;

-- Create sequence if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE relkind = 'S'
        AND relname = 'sellers_seller_id_seq'
    ) THEN
        CREATE SEQUENCE sellers_seller_id_seq START 1;
    END IF;
END $$;

-- Fill missing seller_id values
UPDATE sellers
SET seller_id = nextval('sellers_seller_id_seq')
WHERE seller_id IS NULL;

-- Sync sequence
SELECT setval(
    'sellers_seller_id_seq',
    (SELECT COALESCE(MAX(seller_id), 0) + 1 FROM sellers),
    false
);

-- Apply PRIMARY KEY
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_pkey;
ALTER TABLE sellers ADD CONSTRAINT sellers_pkey PRIMARY KEY (seller_id);
ALTER TABLE sellers ALTER COLUMN seller_id SET DEFAULT nextval('sellers_seller_id_seq');

-- Add unique email constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sellers_email_unique'
    ) THEN
        ALTER TABLE sellers ADD CONSTRAINT sellers_email_unique UNIQUE (email);
    END IF;
END $$;

-- Update from existing columns
UPDATE sellers SET storename = company_name WHERE storename IS NULL;
UPDATE sellers SET description = business_description WHERE description IS NULL;

-- -----------------------------------------
-- 2. UPDATE PRODUCTS TABLE
-- -----------------------------------------
ALTER TABLE products
ADD COLUMN IF NOT EXISTS seller_id INTEGER,
ADD COLUMN IF NOT EXISTS product_group VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_products_seller'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT fk_products_seller
        FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
        ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

UPDATE products SET product_group = title WHERE product_group IS NULL;

-- -----------------------------------------
-- 3. UPDATE ORDERS TABLE
-- -----------------------------------------
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS orderstatus VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paymentstatus VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS returnstatus VARCHAR(50);

-- Sync status columns
UPDATE orders SET status = 'confirmed' WHERE status IS NULL OR status = '';
UPDATE orders SET orderstatus = COALESCE(status, 'pending') WHERE orderstatus IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders(userid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_orderstatus ON orders(orderstatus);
CREATE INDEX IF NOT EXISTS idx_orders_paymentstatus ON orders(paymentstatus);

-- -----------------------------------------
-- 4. CREATE ORDERITEMS TABLE (NOT order_items!)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS orderitems (
    order_item_id SERIAL PRIMARY KEY,
    orderid INTEGER NOT NULL,
    productid INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (orderid) REFERENCES orders(orderid) ON DELETE CASCADE,
    FOREIGN KEY (productid) REFERENCES products(productid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orderitems_orderid ON orderitems(orderid);
CREATE INDEX IF NOT EXISTS idx_orderitems_productid ON orderitems(productid);

-- -----------------------------------------
-- 5. CREATE RETURN_CANCEL_REQUESTS TABLE
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS return_cancel_requests (
    request_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('return', 'cancel')),
    reason VARCHAR(255),
    comments TEXT,
    request_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    resolved_date TIMESTAMP,
    resolved_by INTEGER REFERENCES sellers(seller_id),
    FOREIGN KEY (order_id) REFERENCES orders(orderid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_return_cancel_orderid ON return_cancel_requests(order_id);

-- -----------------------------------------
-- 6. CREATE RETURN_REQUESTS TABLE
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
    request_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    comments TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    request_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_date TIMESTAMP,
    refund_amount NUMERIC(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(orderid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_return_requests_orderid ON return_requests(order_id);



-- -----------------------------------------
-- 6A. FIX REVIEWS TABLE - CHANGE reviewid TO TEXT
-- -----------------------------------------

-- Check if reviews table exists and fix the column type
DO $$
BEGIN
    -- Check if reviews table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Change reviewid from INTEGER to TEXT
        ALTER TABLE reviews ALTER COLUMN reviewid TYPE TEXT;
        RAISE NOTICE '✅ Reviews table reviewid changed to TEXT';
    ELSE
        -- Create reviews table if it doesn't exist
        CREATE TABLE reviews (
            reviewid TEXT PRIMARY KEY,
            userid INTEGER NOT NULL,
            productid INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            title VARCHAR(100) NOT NULL,
            comment TEXT NOT NULL,
            createdat TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
            FOREIGN KEY (productid) REFERENCES products(productid) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_reviews_userid ON reviews(userid);
        CREATE INDEX IF NOT EXISTS idx_reviews_productid ON reviews(productid);
        CREATE INDEX IF NOT EXISTS idx_reviews_createdat ON reviews(createdat);
        
        RAISE NOTICE '✅ Reviews table created with TEXT reviewid';
    END IF;
END $$;



-- -----------------------------------------
-- 7. CREATE TEST SELLER WITH AUTO-HASHED PASSWORD
-- -----------------------------------------

DO $$
DECLARE
  seller_email TEXT := 'seller@test.com';
  seller_password TEXT := 'seller123'; -- Plain text password
  seller_exists BOOLEAN;
  new_seller_id INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM sellers WHERE email = seller_email) INTO seller_exists;
  
  IF seller_exists THEN
    -- Update existing seller with hashed password
    UPDATE sellers
    SET password = crypt(seller_password, gen_salt('bf', 10)), -- Auto-hash with bcrypt
        name = 'Test Seller',
        storename = 'Demo Store',
        description = 'Test seller account',
        verified = true
    WHERE email = seller_email
    RETURNING seller_id INTO new_seller_id;
    
    RAISE NOTICE '✅ Seller updated: %', seller_email;
  ELSE
    -- Create new seller with hashed password
    INSERT INTO sellers (name, email, password, storename, description, verified)
    VALUES (
      'Test Seller', 
      seller_email, 
      crypt(seller_password, gen_salt('bf', 10)), -- Auto-hash with bcrypt
      'Demo Store', 
      'Test seller account', 
      true
    )
    RETURNING seller_id INTO new_seller_id;
    
    RAISE NOTICE '✅ Seller created: %', seller_email;
  END IF;
END $$;


-- Link products to test seller
UPDATE products 
SET seller_id = (SELECT seller_id FROM sellers WHERE email = 'seller@test.com' LIMIT 1)
WHERE productid IN (
    SELECT productid FROM products 
    WHERE seller_id IS NULL OR seller_id NOT IN (SELECT seller_id FROM sellers)
    LIMIT 20
);

-- -----------------------------------------
-- 8. VERIFY SCHEMA
-- -----------------------------------------
SELECT '✅ Schema Update Complete!' as status;

SELECT 'Seller Login Credentials:' as info;
SELECT seller_id, email as "Email", 'seller123' as "Password", storename, verified
FROM sellers WHERE email = 'seller@test.com';

SELECT 'Products linked to seller:' as info;
SELECT COUNT(*) as total_products FROM products 
WHERE seller_id = (SELECT seller_id FROM sellers WHERE email = 'seller@test.com');






-- -----------------------------------------
-- 9. TRANSFER PRODUCTS TO TEST SELLER
-- -----------------------------------------
-- Transfer all products from John Doe (seller_id 1) to Test Seller (seller_id 4)
-- This ensures the test seller account has products to display
UPDATE products 
SET seller_id = 4 
WHERE seller_id = 1;

-- -----------------------------------------
-- 10. VERIFY FINAL SETUP
-- -----------------------------------------
SELECT '✅ Product Transfer Complete!' as status;

SELECT 'Seller Product Distribution:' as info;
SELECT 
    s.seller_id, 
    s.name, 
    s.email, 
    COUNT(p.productid) as product_count
FROM sellers s
LEFT JOIN products p ON s.seller_id = p.seller_id
GROUP BY s.seller_id, s.name, s.email
ORDER BY product_count DESC;

SELECT 'Test Seller Products:' as info;
SELECT COUNT(*) as total_products 
FROM products 
WHERE seller_id = 4;
