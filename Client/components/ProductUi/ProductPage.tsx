import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Stars from './Stars'
import { ShoppingCartIcon, ReceiptRefundIcon, HeartIcon, CurrencyRupeeIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addItemToCart, addItemToWishlist } from '@/features/UIUpdates/CartWishlist'
import ReviewSection from './Product/ReviewSection'
import ProductNotFound from './Product/ProductNotFound'
import productDataHandler from '@/app/api/product'
import { useParams, useRouter } from 'next/navigation'
import Loading from '../Loading'
import Options from './Product/Options'
import { cartAddHandler, wishlistAddHandler } from '@/app/api/itemLists'
import { useApp } from '@/Helpers/AccountDialog'
import ProductDialogs from './ProductDialogs'
import Link from 'next/link'

// Interface for individual reviews
interface Review {
  reviewid: number;
  userid: number;
  rating: number;
  title: string;
  comment: string;
  username: string;
  createdat: string;
  productstars: number;
}

// Interface for images in imgcollection
interface ProductImage {
  imageid: number;
  imglink: string;
  imgalt: string;
}

// Interface for sizes
interface ProductSize {
  sizeid: number;
  sizename: string;
  instock: boolean;
}

// Interface for colors
interface ProductColor {
  colorid: number;
  colorname: string;
  colorclass: string;
}

// Interface for categories
interface Categories {
  subcategory: string;
  maincategory: string;
}

// Interface for seller comparison
interface Seller {
  sellerid: number;
  sellername: string;
  rating: number;
  price: number;
  stock: number;
  deliveryTime?: string;
}

// Main interface for the product
interface Product {
  productid: number,
  title: string;
  description: string;
  stock: number;
  discountedprice: string;
  price: string;
  stars: number;
  seller: string;
  reviewcount: number;
  categories: Categories;
  imglink: string;
  imgalt: string;
  imgcollection: ProductImage[] | [];
  colors: ProductColor[] | [];
  sizes: ProductSize[] | [];
  reviews: Review[] | [];
  sellers?: Seller[] | [];
}

const defaultData = {
  productid: 1,
  title: '',
  description: '',
  stock: 0,
  discountedprice: '',
  price: '',
  stars: 0,
  seller: '',
  reviewcount: 0,
  categories: { subcategory: '', maincategory: '' },
  imglink: '',
  imgalt: '',
  imgcollection: [],
  colors: [],
  sizes: [],
  reviews: [],
  sellers: [],
}

const IDGenerator = () => {
  const ID = Math.round(Math.random() * 1000 * 1000 * 100);
  return ID;
}

const ProductPage = () => {
  const { appState } = useApp();
  const router = useRouter();
  const isLogged = appState.loggedIn;
  const [btnLoading, setbtnLoading] = useState(false);
  const ref = useRef<any>(null);
  const compareRef = useRef<any>(null);
  const colRef = useRef<string>('Default');
  const sizeRef = useRef<string>('Default');
  const totalQuantity = useRef<number>(1);
  const found = useRef<boolean>(true);
  const [selectedRating, setselectedRating] = useState<number>(1);
  const dataVar = useRef<Product>(defaultData);
  const [selectedReview, setselectedReview] = useState<null | Review>(null)
  const data = dataVar.current;
  const [selectedColor, setSelectedColor] = useState<ProductColor>({ colorid: 0, colorname: 'Default', colorclass: 'col_default' });
  const [selectedSize, setSelectedSize] = useState<ProductSize>({ sizeid: 0, sizename: 'Default', instock: true });
  const [selectedImage, setselectedImage] = useState({ imgLink: '', imgAlt: '' });
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const params = useParams<{ productID: string }>()
  const [dataChecked, setdataChecked] = useState<boolean>(false);
  const [loading, setloading] = useState<boolean>(false);
  const [dialogType, setdialogType] = useState<null | string>(null)
  const dispatch = useAppDispatch();
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const listID = { cartItemID: IDGenerator(), wishlistItemID: IDGenerator() };

  // Safely parse discounted price
  const basePrice = parseFloat(data.discountedprice || '0') || 2999;

  // Generate mock sellers data if not available from backend
  const mockSellers: Seller[] = [
    {
      sellerid: 1,
      sellername: data.seller || 'TechStore',
      rating: data.stars || 4.5,
      price: basePrice, // first seller real price
      stock: data.stock || 15,
      deliveryTime: '3-5 days'
    },
    {
      sellerid: 2,
      sellername: 'AudioHub',
      rating: 4.7,
      price: basePrice + 100, // second seller +$100
      stock: 8,
      deliveryTime: '2-4 days'
    },
    {
      sellerid: 3,
      sellername: 'GadgetWorld',
      rating: 4.3,
      price: basePrice + 200, // third seller +$200
      stock: 20,
      deliveryTime: '4-6 days'
    }
  ];

  // Use sellers from data if available, otherwise use mock data
  const sellers = data.sellers && data.sellers.length > 0 ? data.sellers : mockSellers;





  let cartItemData = {
    cartItemID: listID.cartItemID,
    productID: data.productid,
    productImg: data.imglink,
    productAlt: data.imgalt,
    productName: data.title,
    productPrice: selectedSeller ? selectedSeller.price : parseInt(data.discountedprice),
    productColor: colRef.current,
    productSize: sizeRef.current,
    quantity: quantity,
  };

  let wishlistItem = {
    wishlistItemID: listID.wishlistItemID,
    productID: data.productid,
    productImg: data.imglink,
    productAlt: data.imgalt,
    productName: data.title,
    productPrice: selectedSeller ? selectedSeller.price : parseInt(data.discountedprice),
  };

  async function dataRequest() {
    const response = await productDataHandler({ productID: params.productID });

    switch (response.status) {
      case 200:
        dataVar.current = response.data.data;

        // Inject mock reviews if there are none or less than 4
        if (!dataVar.current.reviews || dataVar.current.reviews.length < 4) {
          const mockReviews: Review[] = [
            {
              reviewid: 101,
              userid: 1,
              rating: 5,
              title: "Excellent Product!",
              comment: "The product quality is amazing and delivery was super fast.",
              username: "Ankit S.",
              createdat: new Date().toISOString(),
              productstars: 5
            },
            {
              reviewid: 102,
              userid: 2,
              rating: 4,
              title: "Very Good",
              comment: "Met my expectations, color and size were perfect.",
              username: "Priya K.",
              createdat: new Date().toISOString(),
              productstars: 4
            },
            {
              reviewid: 103,
              userid: 3,
              rating: 5,
              title: "Highly Recommend",
              comment: "Fantastic product for the price. Will buy again!",
              username: "Rahul D.",
              createdat: new Date().toISOString(),
              productstars: 5
            },
            {
              reviewid: 104,
              userid: 4,
              rating: 4,
              title: "Good Purchase",
              comment: "Satisfied with the product. Packaging was neat.",
              username: "Sneha P.",
              createdat: new Date().toISOString(),
              productstars: 4
            },
            {
              reviewid: 105,
              userid: 5,
              rating: 3,
              title: "Decent",
              comment: "Product is okay, could be better in build quality.",
              username: "Vikram R.",
              createdat: new Date().toISOString(),
              productstars: 3
            }
          ];

          dataVar.current.reviews = mockReviews;
          dataVar.current.reviewcount = mockReviews.length;
        }

        if (response.data.data != undefined) totalQuantity.current = response.data.data.stock;
        setdataChecked(true);
        break;

      case 500:
        found.current = false;
        setdataChecked(true);
        break;
    }
  }


  async function setUpData() {
    if (data != undefined) {
      data.colors.length > 0 && setSelectedColor(data.colors[0]);
      data.sizes.length > 0 && setSelectedSize(data.sizes[0]);
      setselectedImage({ imgLink: data.imglink, imgAlt: data.imgalt })
      if (data.sizes.length > 0 && data.colors.length > 0) {
        cartItemData.productColor = data.colors[0].colorname;
        cartItemData.productSize = data.sizes[0].sizename;
      }
      // Set default seller
      if (sellers.length > 0) {
        setSelectedSeller(sellers[0]);
      }
    }
  };

  async function dataInitializer() {
    !dataChecked && await dataRequest();
    dataChecked && await setUpData();
  }

  useLayoutEffect(() => {
    dataInitializer();
  }, [dataChecked])

  const changeValue = (action: string) => {
    switch (action) {
      case 'increase':
        const maxStock = selectedSeller ? selectedSeller.stock : totalQuantity.current;
        (maxStock > quantity && 9 > quantity) && setQuantity(quantity + 1);
        break;
      case 'decrease':
        quantity > 1 && setQuantity(quantity - 1);
        break;
    }
  }

  const handleClick = () => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCompareClick = () => {
    compareRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  function percentageDifference(a: number, b: number) {
    const difference = Math.abs(a - b);
    const average = (a + b) / 2;
    const percentageDiff = (difference / average) * 100;
    return Math.round(percentageDiff);
  }

  async function itemStateUpdate(key: string) {
    setbtnLoading(true);
    switch (key) {
      case 'cart':
        isLogged && await cartAddHandler({ cartItemID: listID.cartItemID, userID: defaultAccount.userID, productID: data.productid, productPrice: selectedSeller ? selectedSeller.price : parseInt(data.discountedprice), colorID: selectedColor.colorid, sizeID: selectedSize.sizeid, quantity })
        dispatch(addItemToCart(cartItemData));
        setbtnLoading(false)
        break;
      case 'wishlist':
        isLogged && await wishlistAddHandler({ wishlistItemID: listID.wishlistItemID, userID: defaultAccount.userID, productID: data.productid })
        dispatch(addItemToWishlist(wishlistItem));
        setbtnLoading(false);
        break;
    }
  }

  function categoryLink(maincategory: string, category: string) {
    const splitCat = category.split(' ').join('-');
    return `/sub-category/${maincategory}/${splitCat}`
  }

  const handleSellerChange = (seller: Seller) => {
    setSelectedSeller(seller);
    totalQuantity.current = seller.stock;
    if (quantity > seller.stock) {
      setQuantity(1);
    }
  };

  const currentPrice = selectedSeller ? selectedSeller.price : parseInt(data.discountedprice);
  const currentStock = selectedSeller ? selectedSeller.stock : data.stock;
  const currentSeller = selectedSeller ? selectedSeller.sellername : data.seller;

  return (
    <>
      {loading && <div className='w-full h-[500px]'>{loading && <div className='absolute left-0 right-0 top-[30%] z-50'><Loading /></div>}</div>}
      <ProductDialogs dialogType={dialogType} setdialogType={setdialogType} setloading={setloading} productID={data.productid} selectedReview={selectedReview} selectedRating={selectedRating} setselectedRating={setselectedRating} />
      <div className='flex flex-col gap-5 border-t-[1px] w-[100%]'>
        {!dataChecked && <Loading />}
        {(dataChecked && data != undefined) && <>{found.current && <>
          <div className='flex items-center flex-col justify-center'>
            <div className='w-[80%] mb-5 mt-5'>
              <p>{data.categories.maincategory} {'>'} {data.categories.subcategory}</p>
            </div>
          </div>
          <div className='flex justify-center gap-10 flex-col items-center lg:flex-row'>
            <div className='flex img-wrapper flex-col gap-5 w-[90%] md:w-[60%] px-2 lg:w-[600px] lg:h-[600px] rounded-xl items-center'>
              <img className='border-[1px] rounded-xl w-[100%] lg:w-[600px] lg:h-[600px] hover-zoom' src={selectedImage.imgLink} alt={selectedImage.imgAlt} />
              <div className='flex gap-5 justify-center'>
                {data.imgcollection.map((each, index) => (
                  <img
                    key={index}
                    src={each.imglink}
                    alt={each.imgalt}
                    height={75}
                    width={75}
                    className="rounded-md border-[1px] hover:drop-shadow-custom-xl mb-6"
                    onClick={() => {
                      const imageDetails = { imgLink: each.imglink, imgAlt: each.imgalt };
                      setselectedImage(imageDetails);
                    }}
                  />
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-5 border-[1px] py-10 px-10 max-w-[90%] rounded-xl lg:max-w-[50%] w-auto'>
              <div className='border-b-[1px] pb-5 mb-2'>
                <p className='text-3xl max-w-[600px] font-medium'>{data.title}</p>
                <p className='text-silver'>By {currentSeller}</p>
                <div className="flex items-center">
                  <p className='mr-1 text-sm'>{selectedSeller ? selectedSeller.rating : data.stars}</p>
                  <Stars stars={selectedSeller ? selectedSeller.rating : data.stars} />
                  <button onClick={handleClick} className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {data.reviewcount} reviews
                  </button>
                </div>
                {sellers.length > 1 && (
                  <button
                    onClick={handleCompareClick}
                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Compare {sellers.length} Sellers
                  </button>
                )}
              </div>
              <div className='flex gap-5 items-center'>
                <p className='font-bold text-3xl'>₹ {currentPrice}</p>
                <p className='line-through'>₹ {data.price}</p>
                <p className='text-yellow-500'>{percentageDifference(currentPrice, parseInt(data.price))}% off</p>
              </div>
              <p><span className='font-semibold'>In stock</span>: {currentStock} units available • Dispatch in 5 working days</p>
              <div className='flex gap-10 items-center'>
                <p>Quantity</p>
                <div className='flex items-center justify-center rounded-xl bg-gray-100'>
                  <button onClick={() => changeValue('decrease')} className='w-[50px] text-4xl bg-gray-100 rounded-l-lg'>-</button>
                  <p className='bg-gray-100 w-[20px]'>{quantity}</p>
                  <button onClick={() => changeValue('increase')} className='w-[40px] text-4xl bg-gray-100 rounded-r-lg'>+</button>
                </div>

              </div>
              {/*  */}
              <Options sizes={data.sizes} colors={data.colors} selectedColor={selectedColor} setSelectedColor={setSelectedColor} selectedSize={selectedSize} setSelectedSize={setSelectedSize} colRef={colRef} sizeRef={sizeRef} cartItemData={cartItemData} />
              {/*  */}
              <div className='flex gap-5'>
                <button disabled={btnLoading} onClick={() => itemStateUpdate('cart')} className='w-[200px] h-[50px] bg-yellow-400 rounded-lg hover:border-yellow-400 hover:border-2 hover:bg-white transition-colors duration-300 font-semibold'>
                  {btnLoading ? <div className="relative"><div className=''>
                    <div className='drop-shadow-custom-xl rounded-xl w-[120px] mx-auto'>
                      <div className="border-gray-300 my-auto mx-auto h-8 w-8 animate-spin rounded-full border-8 border-t-blue-600" />
                    </div>

                  </div></div> : "ADD TO CART"}
                </button>
                <button onClick={() => router.push(`/checkout/${data.productid}/${selectedSize.sizeid}/${selectedColor.colorid}`)} className='w-[200px] h-[50px] rounded-lg font-semibold border-yellow-400 hover:bg-yellow-400 transition-colors duration-300 border-[2px]'>BUY NOW</button>
              </div>
              <div className='flex gap-10 text-silver text-sm border-b-[1px] pb-10'>
                <button disabled={btnLoading} onClick={() => itemStateUpdate('wishlist')} className='flex hover:text-yellow-400 transition-colors duration-300 items-center gap-1 cursor-pointer'>
                  <HeartIcon width={25} />
                  <div>{btnLoading ? <div className="relative"><div className=''>
                    <div className='drop-shadow-custom-xl rounded-xl w-[120px] mx-auto'>
                      <div className="border-gray-300 my-auto mx-auto h-8 w-8 animate-spin rounded-full border-8 border-t-blue-600" />
                    </div>

                  </div></div> : "Add to wishlist"}</div>
                </button>
                <Link href={categoryLink(data.categories.maincategory, data.categories.subcategory)} className='flex hover:text-yellow-400 transition-colors duration-300 items-center gap-1 cursor-pointer'>
                  <GlobeAltIcon width={25} />
                  <p>Find alternate products</p>
                </Link>
              </div>
              <div className='flex gap-4 flex-wrap mb-10 border-b-[1px] pb-5 text-sm'>
                <div className='flex gap-2'>
                  <div className='bg-yellow-300 rounded-full px-2 py-2'>
                    <ShoppingCartIcon width={30} />
                  </div>
                  <p className='w-[135px]'>Get it by Thu, 20 Aug</p>
                </div>
                <div className='flex gap-2'>
                  <div className='bg-yellow-300 rounded-full px-2 py-2'>
                    <ReceiptRefundIcon width={30} />
                  </div>
                  <p className='w-[135px]'>Easy returns available</p>
                </div>
                <div className='flex gap-1'>
                  <div className='bg-yellow-300 rounded-full px-2 py-2'>
                    <CurrencyRupeeIcon width={30} />
                  </div>
                  <p className='w-[135px]'>Cash on delivery available</p>
                </div>
              </div>
              <div className='flex flex-col gap-5'>
                <p className='font-semibold'>Description:</p>
                <p className='w-[600px]'>{data.description}</p>
              </div>

            </div>
          </div>

          {/* Compare Sellers Section */}
          {sellers.length > 1 && (
            <div ref={compareRef} className="flex justify-center mt-10 mb-10">
              <div className="w-[90%] lg:w-[80%]">
                <h2 className="text-2xl font-semibold mb-6">Compare Sellers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellers.map((seller) => (
                    <div
                      key={seller.sellerid}
                      className={`border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${selectedSeller?.sellerid === seller.sellerid ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{seller.sellername}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Stars stars={seller.rating} />
                            <span className="text-gray-600 font-medium">{seller.rating.toFixed(1)}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Trusted</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">${seller.price}</p>
                          <p className="text-sm text-gray-500">{seller.stock} in stock</p>
                        </div>
                      </div>

                      {seller.deliveryTime && (
                        <p className="text-sm text-gray-600 mb-4">Delivery: {seller.deliveryTime}</p>
                      )}

                      <button
                        onClick={() => handleSellerChange(seller)}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors duration-300 ${selectedSeller?.sellerid === seller.sellerid
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                      >
                        {selectedSeller?.sellerid === seller.sellerid ? 'Selected' : 'Select Seller'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Price Comparison Summary */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Price Comparison Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Lowest Price</p>
                      <p className="text-xl font-bold text-green-600">
                        ${Math.min(...sellers.map(s => s.price))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Highest Rating</p>
                      <p className="text-xl font-bold text-blue-600">
                        {Math.max(...sellers.map(s => s.rating))} ★
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Most Stock</p>
                      <p className="text-xl font-bold text-purple-600">
                        {Math.max(...sellers.map(s => s.stock))} units
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          <div ref={ref}>
            <ReviewSection data={data.reviews} setdialogType={setdialogType} setloading={setloading} reviewCount={data.reviewcount} setselectedReview={setselectedReview} setselectedRating={setselectedRating} allReview={false} productID={data.productid} />
          </div></>
        }</>}
        {(dataChecked && !found.current) && <ProductNotFound />}
      </div>
    </>
  )
}

export default ProductPage