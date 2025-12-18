import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, Radio, RadioGroup, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon, TruckIcon, ShieldCheckIcon, CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addItemToCart } from '@/features/UIUpdates/CartWishlist'
import Link from 'next/link'
import { useApp } from '@/Helpers/AccountDialog'
import { cartAddHandler } from '@/app/api/itemLists'
import Stars from './Stars'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface Color {
  colorid: number
  name: string
  colorname: string
  colorclass: string
}

interface Size {
  sizeid: number
  name: string
  sizename: string
  instock: boolean
}

interface ProductImage {
  imageid: number
  imglink: string
  imgalt: string
}

interface Product {
  productid: number
  title: string
  category: string
  price: string
  discount: string
  stars: number
  isnew: boolean
  issale: boolean
  isdiscount: boolean
  colors: Color[]
  sizes: Size[]
  reviewCount: number
  images: ProductImage
  description?: string
}

interface SellerInfo {
  seller_id: number
  seller_name: string
  storename: string
  rating: number
  verified: boolean
  final_price?: number
  discount?: number
}

interface ProductFeature {
  icon: any
  title: string
  description: string
}

interface QuickviewProps {
  product: Product
  open: boolean
  setOpen: (open: boolean) => void
}

const IDGenerator = () => Math.round(Math.random() * 100000000)

const productFeatures: ProductFeature[] = [
  { icon: TruckIcon, title: 'Fast Delivery', description: 'Get your order delivered within 5-7 business days' },
  { icon: ShieldCheckIcon, title: 'Quality Assured', description: 'All products go through 10-point quality check' },
  { icon: CreditCardIcon, title: 'Secure Payment', description: 'Multiple payment options with secure checkout' },
  { icon: ArrowPathIcon, title: 'Easy Returns', description: '30-day hassle-free return policy' },
]

export default function Quickview({ product, open, setOpen }: QuickviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers'>('overview')
  const [selectedColor, setSelectedColor] = useState<Color>(
    product.colors.length ? product.colors[0] : { colorid: 0, name: 'Default', colorname: 'Default', colorclass: '' }
  )
  const [selectedSize, setSelectedSize] = useState<Size>(
    product.sizes.length ? product.sizes[0] : { sizeid: 0, name: 'Default', sizename: 'Default', instock: true }
  )
  const [btnLoading, setBtnLoading] = useState(false)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [compareSellers, setCompareSellers] = useState<SellerInfo[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const { appState } = useApp()
  const dispatch = useAppDispatch()
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const listID = { cartItemID: IDGenerator() }
  const isLogged = appState.loggedIn

  const cartItemData = {
    cartItemID: listID.cartItemID,
    productID: product.productid,
    productImg: product.images.imglink,
    productAlt: product.images.imgalt,
    productName: product.title,
    productPrice: parseFloat(product.discount) || parseFloat(product.price),
    productColor: selectedColor.colorname,
    productSize: selectedSize.sizename,
    quantity: 1,
  }

  useEffect(() => {
    if (!open) return
    if (product.colors.length) setSelectedColor(product.colors[0])
    if (product.sizes.length) setSelectedSize(product.sizes[0])
    fetchProductDetails()
  }, [open])

  const fetchProductDetails = async () => {
    setLoadingData(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500'

      const sellerResponse = await fetch(`${API_URL}/api/products/with-seller/${product.productid}`)
      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json()
        setSellerInfo({
          seller_id: sellerData.seller_id,
          seller_name: sellerData.seller_name || sellerData.soldBy,
          storename: sellerData.storename || sellerData.soldBy,
          rating: sellerData.seller_rating || 0,
          verified: sellerData.verified || false,
        })
        if (sellerData.otherSellers && sellerData.otherSellers.length) {
          setCompareSellers(sellerData.otherSellers)
        }
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const addCart = async () => {
    setBtnLoading(true)
    if (isLogged) {
      await cartAddHandler({
        cartItemID: listID.cartItemID,
        userID: defaultAccount.userID,
        productID: product.productid,
        productPrice: parseFloat(product.discount) || parseFloat(product.price),
        colorID: selectedColor.colorid,
        sizeID: selectedSize.sizeid,
        quantity: 1,
      })
    }
    dispatch(addItemToCart(cartItemData))
    setBtnLoading(false)
  }

  return (
    <Transition show={open}>
      <Dialog className="relative z-50" onClose={setOpen}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 hidden bg-gray-500 bg-opacity-75 transition-opacity md:block" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            >
              <DialogPanel className="flex w-full transform text-left text-base transition md:my-8 md:max-w-5xl md:px-4">
                <div className="relative flex w-full items-start overflow-hidden bg-white rounded-xl px-4 pb-8 pt-14 shadow-2xl sm:px-6 sm:pt-8 md:p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 sm:right-6 sm:top-8 md:right-6 md:top-6 lg:right-8 lg:top-8 z-10"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <div className="grid w-full grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-12 lg:gap-x-8">
                    {/* Product Image */}
                    <div className="sm:col-span-4 lg:col-span-5">
                      <div className="aspect-h-3 aspect-w-2 overflow-hidden rounded-lg bg-gray-100 sticky top-0">
                        <img src={product.images.imglink} alt={product.images.imgalt} className="object-cover object-center" />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="sm:col-span-8 lg:col-span-7">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 pr-4">{product.title}</h2>
                        {sellerInfo?.verified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                            <ShieldCheckIcon className="w-4 h-4 mr-1" /> Verified
                          </span>
                        )}
                      </div>

                      {/* Seller Info */}
                      {sellerInfo && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Sold by</p>
                              <p className="font-semibold text-gray-900">{sellerInfo.storename}</p>
                            </div>
                            <Stars stars={sellerInfo.rating || 0} size={20} />
                          </div>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-6">
                        <p className="text-3xl font-bold text-gray-900">${product.discount}</p>
                        {product.price !== product.discount && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-lg text-gray-500 line-through">${product.price}</p>
                            <p className="text-sm font-medium text-green-600">
                              {Math.round(((parseFloat(product.price) - parseFloat(product.discount)) / parseFloat(product.price)) * 100)}% OFF
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tabs */}
                      {compareSellers.length > 0 && (
                        <div className="border-b border-gray-200 mb-4">
                          <nav className="flex space-x-8">
                            <button
                              onClick={() => setActiveTab('overview')}
                              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              Overview
                            </button>
                            <button
                              onClick={() => setActiveTab('sellers')}
                              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'sellers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              Compare Sellers
                            </button>
                          </nav>
                        </div>
                      )}

                      {/* Tab Content */}
                      <div className="mb-6 max-h-[400px] overflow-y-auto">
                        {activeTab === 'overview' && (
                          <div>
                            {/* Product Features */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              {productFeatures.map((feature, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <feature.icon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Colors */}
                            {product.colors.length > 0 && (
                              <fieldset aria-label="Choose a color" className="mb-4">
                                <legend className="text-sm font-medium text-gray-900 mb-2">Color</legend>
                                <RadioGroup value={selectedColor} onChange={setSelectedColor} className="flex items-center space-x-3">
                                  {product.colors.map((color) => (
                                    <Radio
                                      key={color.colorname}
                                      value={color}
                                      aria-label={color.colorname}
                                      className={({ focus, checked }) =>
                                        classNames(
                                          color.colorclass,
                                          focus && checked ? 'ring ring-offset-1' : '',
                                          !focus && checked ? 'ring-2' : '',
                                          'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none'
                                        )
                                      }
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={classNames(color.colorclass, 'h-8 w-8 rounded-full border border-black border-opacity-10')}
                                      />
                                    </Radio>
                                  ))}
                                </RadioGroup>
                              </fieldset>
                            )}

                            {/* Sizes */}
                            {product.sizes.length > 0 && (
                              <fieldset className="mb-6" aria-label="Choose a size">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-medium text-gray-900">Size</div>
                                </div>
                                <RadioGroup value={selectedSize} onChange={setSelectedSize} className="grid grid-cols-4 gap-4">
                                  {product.sizes.map((size) => (
                                    <Radio
                                      key={size.sizename}
                                      value={size}
                                      disabled={!size.instock}
                                      className={({ focus }) =>
                                        classNames(
                                          size.instock ? 'cursor-pointer bg-white text-gray-900 shadow-sm' : 'cursor-not-allowed bg-gray-50 text-gray-200',
                                          focus ? 'ring-2 ring-indigo-500' : '',
                                          'group relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1'
                                        )
                                      }
                                    >
                                      {({ checked, focus }) => (
                                        <>
                                          <span>{size.sizename}</span>
                                          {size.instock ? (
                                            <span
                                              className={classNames(
                                                checked ? 'border-indigo-500' : 'border-transparent',
                                                focus ? 'border' : 'border-2',
                                                'pointer-events-none absolute -inset-px rounded-md'
                                              )}
                                              aria-hidden="true"
                                            />
                                          ) : (
                                            <span aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-md border-2 border-gray-200">
                                              <svg className="absolute inset-0 h-full w-full stroke-2 text-gray-200" viewBox="0 0 100 100" preserveAspectRatio="none" stroke="currentColor">
                                                <line x1={0} y1={100} x2={100} y2={0} vectorEffect="non-scaling-stroke" />
                                              </svg>
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Radio>
                                  ))}
                                </RadioGroup>
                              </fieldset>
                            )}
                          </div>
                        )}

                        {activeTab === 'sellers' && (
                          <div className="space-y-4">
                            {loadingData ? (
                              <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                              </div>
                            ) : compareSellers.length > 0 ? (
                              <>
                                <p className="text-sm text-gray-600 mb-4">Compare prices from different sellers for the same product:</p>
                                <div className="space-y-3">
                                  {compareSellers.map((seller, index) => (
                                    <div key={index} className="border rounded-lg p-4 hover:border-indigo-500 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-semibold text-gray-900">{seller.storename}</p>
                                          <Stars stars={seller.rating} size={18} />
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xl font-bold text-indigo-600">${seller.final_price?.toFixed(2)}</p>
                                          {seller.discount && <p className="text-sm text-green-600">{seller.discount}% OFF</p>}
                                        </div>
                                      </div>
                                      <Link href={`/product/${product.productid}`}>
                                        <button className="mt-3 w-full bg-indigo-50 text-indigo-600 py-2 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors">
                                          View Offer
                                        </button>
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <p>No other sellers available for this product</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={addCart}
                          disabled={btnLoading}
                          className="w-full flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {btnLoading ? <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 'Add to Cart'}
                        </button>
                        <Link href={`/product/${product.productid}`}>
                          <button className="w-full border border-indigo-600 text-indigo-600 py-3 rounded-md text-base font-medium hover:bg-indigo-50 transition-colors">
                            View Full Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
