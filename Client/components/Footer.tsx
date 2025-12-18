"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  ShoppingCart,
  Send,
} from "lucide-react";
import { footerSections, footerCategories } from "@/app/data";

const Footer = () => {
  return (
    <footer className="bg-[#0c0c0f] text-gray-300 w-full pt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">

        {/* ------------------ TOP BRAND BAR ------------------ */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 pb-7 border-b border-gray-700">
          {/* Brand */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Style Kart
              </h2>
            </div>

            <p className="text-gray-400 leading-relaxed text-sm">
              Your trusted e-commerce partner from 2025. Discover premium fashion,
              electronics, and lifestyle products with lightning-fast delivery,
              secure payments, and 24/7 customer support.
            </p>


            {/* Contact */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <p className="text-sm">support@stylekart.com</p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400" />
                <p className="text-sm">+91 98765 43210</p>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <p className="text-sm">Patna, Bihar, India</p>
              </div>
            </div>
          </div>



          {footerSections.slice(0, -1).map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-bold text-white mb-4">{section.sectionName}</h3>
              <ul className="space-y-2 text-sm">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.link}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ------------------ SOCIAL + PAYMENTS ------------------ */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 py-8">

          {/* Social Links */}
          <div className="flex items-center gap-4">

            {/* GitHub */}
            <Link href="https://github.com/mdfaizaanalam" target="_blank">
              <Github className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

            {/* LinkedIn */}
            <Link href="https://www.linkedin.com/in/mdfaizaanalam" target="_blank">
              <Linkedin className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

            {/* Instagram */}
            <Link href="https://instagram.com" target="_blank">
              <Instagram className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

            {/* Twitter */}
            <Link href="https://twitter.com" target="_blank">
              <Twitter className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

            {/* Facebook */}
            <Link href="https://facebook.com" target="_blank">
              <Facebook className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

            {/* YouTube */}
            <Link href="https://youtube.com" target="_blank">
              <Youtube className="w-6 h-6 text-gray-400 hover:text-white hover:scale-125 transition-all cursor-pointer" />
            </Link>

          </div>



          {/* Payment Methods */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">Payments:</p>
            <img
              src="https://codewithsadee.github.io/anon-ecommerce-website/assets/images/payment.png"
              className="h-8 opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* ------------------ COPYRIGHT ------------------ */}
        <div className="py-6 border-t border-gray-700 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Style Kart • Your Premium Shopping Destination
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> • </span>
          Crafted with ❤️ by{" "}
          <Link
            href="https://www.linkedin.com/in/mdfaizaanalam"
            className="text-blue-400 hover:underline font-semibold"
            target="_blank"
          >
            Md Faizaan Alam
          </Link>
          {" "}- Full Stack Developer
        </div>

      </div>
    </footer>
  );
};

export default Footer;
