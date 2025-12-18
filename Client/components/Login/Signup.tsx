import { CheckIcon } from '@heroicons/react/24/outline'
import React, { useState } from 'react'
import { loginFeatures } from '@/app/data';
import Link from 'next/link';
import { Checkbox } from '@headlessui/react'
import { useApp } from '@/Helpers/AccountDialog';
import useAuth from '@/controllers/Authentication';
import Loading from '../Loading';

const Signup = () => {
    const [updates, setUpdates] = useState(false);
    const { registerUser } = useAuth();
    const { toggleAgreement, toggleIsPassword, appState, toggleIsOpenAgreement } = useApp();
    const [loading, setloading] = useState(false);

    async function register(e: any, agreement: boolean, promotion: boolean) {
        e.preventDefault();
        const data = {
            userName: e.target.name.value,
            email: e.target.email.value,
            password: e.target.password.value,
            mobile_number: e.target.mobilenum.value,
            dob: e.target.dob.value
        };
        if (e.target.password.value === e.target.repassword.value) {
            if (agreement) {
                setloading(true);
                await registerUser(data, promotion, setloading);
            } else toggleIsOpenAgreement();
        } else toggleIsPassword();
    };

    return (
        <section className="bg-gray-50 h-screen w-screen relative flex items-center justify-center overflow-x-hidden">


            {loading && (
                <div className='absolute inset-0 flex items-center justify-center bg-white/70 z-50'>
                    <Loading />
                </div>
            )}

            <section className="w-[95%] mx-auto flex justify-center">
                <div className='flex lg:h-[750px] justify-between gap-10'>

                    {/* LEFT SIDE */}
                    <div className='h-full lg:flex lg:flex-col w-auto hidden lg:justify-between pt-8 pb-8'>

                        <div>
                            <a href="/" className="flex items-center text-2xl mb-2 font-semibold text-gray-900">
                                <img className="w-12 h-12 mr-2" src="https://www.strivemindz.com/images/offerings/icons/ecommerce.png" alt="logo" />
                                Style Kart
                            </a>

                            <div className='flex flex-col gap-5'>
                                {loginFeatures.map((each, index) =>
                                    <div key={index} className='flex gap-4 items-start'>
                                        <CheckIcon width={25} className='text-white bg-primary-600 rounded-full py-1 px-1 mt-2' />
                                        <div>
                                            <h1 className='font-medium'>{each.title}</h1>
                                            <p className='text-sm font-medium'>{each.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='hidden lg:flex lg:fixed lg:bottom-8 lg:left-8 gap-5 text-gray-500 font-medium text-sm'>
                            <Link className='hover:underline hover:text-gray-800' href={'/about'}>About</Link>
                            <Link className='hover:underline hover:text-gray-800' href={'/policy/terms&conditions'}>Terms & Conditions</Link>
                            <Link className='hover:underline hover:text-gray-800' href={'/policy/privacypolicy'}>Privacy</Link>
                            <Link className='hover:underline hover:text-gray-800' href={'/contact'}>Contact</Link>
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex flex-col items-center min-w-[500px] px-6 py-8 mx-auto">

                        <div className="w-full bg-white rounded-lg shadow sm:max-w-md xl:p-0">
                            <div className="p-6 space-y-4">

                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                    Create new account
                                </h1>

                                <form onSubmit={e => register(e, appState.agreement, updates)} className="space-y-4">

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Full Name</label>
                                        <input minLength={4} required type="text" name="name" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
                                        <input minLength={5} required type="email" name="email" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Password</label>
                                        <input minLength={8} required type="password" name="password" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Re-Enter Password</label>
                                        <input minLength={8} required type="password" name="repassword" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Mobile Number</label>
                                        <input required type="tel" minLength={10} maxLength={10} pattern="\d{10}" name="mobilenum" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900">Date of Birth</label>
                                        <input required type="date" name="dob" className="bg-gray-50 border border-gray-300 rounded-lg w-full p-2.5" />
                                    </div>

                                    {/* AGREEMENTS */}
                                    <div className="flex flex-col gap-4">

                                        <div className="flex items-start">
                                            <Checkbox
                                                checked={appState.agreement}
                                                onChange={toggleAgreement}
                                                className="group w-5 h-5 rounded border bg-white data-[checked]:bg-blue-500 flex-shrink-0"
                                            >
                                                <svg className="stroke-white opacity-0 group-data-[checked]:opacity-100" viewBox="0 0 14 14" fill="none">
                                                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" />
                                                </svg>
                                            </Checkbox>

                                            <div className="ml-3 text-sm">
                                                <p className="text-gray-500">
                                                    By signing up, you agree to Style Kart
                                                    <Link href="/policy/terms&conditions" className="text-primary-700 font-medium"> Terms & Conditions </Link>
                                                    and
                                                    <Link href="/policy/privacypolicy" className="text-primary-700 font-medium"> Privacy Policy.</Link>
                                                </p>
                                            </div>
                                        </div>


                                        <div className="flex items-start">
                                            <Checkbox
                                                checked={updates}
                                                onChange={setUpdates}
                                                className="group block size-5 rounded border bg-white data-[checked]:bg-blue-500"
                                            >
                                                <svg className="stroke-white opacity-0 group-data-[checked]:opacity-100" viewBox="0 0 14 14" fill="none">
                                                    <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" />
                                                </svg>
                                            </Checkbox>

                                            <div className="ml-3 text-sm text-gray-500">Email me about product updates and resources.</div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5">
                                        Sign up with New account
                                    </button>

                                    <p className="text-sm font-light text-gray-500">
                                        Already have an account?{" "}
                                        <Link href="/sign-in" className="font-medium text-primary-600 hover:underline">Sign in</Link>
                                    </p>

                                    {/* SELLER REGISTRATION LINK ADDED */}
                                    <p className="text-sm font-light text-gray-500">
                                        Want to sell on Style Kart?{" "}
                                        <Link href="/seller/login" className="font-medium text-blue-600 hover:underline">
                                            Register as Seller
                                        </Link>
                                    </p>

                                </form>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

        </section>
    )
};

export default Signup;
