"use client";
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShoppingCart, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import { useCart } from '@/context/CartContext';

const CartPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { items: cartItems, removeItem, updateQuantity, clearCart, totalAmount: subtotal } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address'>('cart');
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: user?.phone || ''
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (user?.role === 'admin' || user?.role === 'technician') {
      alert("Administrators and technicians cannot place customer orders.");
      return;
    }
    
    if (cartItems.length === 0) return;
    router.push('/checkout');
  };

  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="h-32"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackButton className="mb-10" />
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between border-b border-border-base pb-8">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-fg-primary">Your <span className="text-blue-500">Cart</span></h1>
              <span className="text-xs font-black uppercase tracking-widest text-fg-muted">{cartItems.length} Item{cartItems.length !== 1 ? 's' : ''} Selected</span>
            </div>

            {cartItems.length > 0 ? (
              <div className="space-y-6">
                   {cartItems.map(item => (
                   <div key={`${item.id}-${item.package}`} className="glass-card p-6 rounded-[2.5rem] flex items-center gap-8 border-border-base group">
                    <div className="w-32 h-32 rounded-2xl bg-bg-muted flex items-center justify-center p-4 relative overflow-hidden">
                      <NextImage src={item.image} alt={item.name} fill className="object-contain p-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.category}</p>
                        <h3 className="text-xl font-black uppercase tracking-tight text-fg-primary">{item.name}</h3>
                        {item.package !== 'single' && <span className="text-[8px] px-2 py-0.5 bg-blue-600/10 text-blue-500 rounded-md font-black uppercase">{item.package}</span>}
                        <div className="flex items-center space-x-4 pt-2">
                           <button 
                             onClick={() => removeItem(item.id, item.package)}
                             className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                           >
                             <Trash2 className="h-3 w-3" /> Remove
                           </button>
                        </div>
                     </div>
                     <div className="flex items-center space-x-6">
                        <div className="flex items-center bg-bg-muted rounded-2xl p-1 border border-border-base">
                           <button 
                             onClick={() => updateQuantity(item.id, item.package, -1)}
                             className="p-3 hover:bg-bg-surface rounded-xl transition-all text-fg-primary"
                           >
                             <Minus className="h-3 w-3" />
                           </button>
                           <span className="w-12 text-center font-black text-fg-primary">{item.quantity}</span>
                           <button 
                             onClick={() => updateQuantity(item.id, item.package, 1)}
                             className="p-3 hover:bg-bg-surface rounded-xl transition-all text-fg-primary"
                           >
                             <Plus className="h-3 w-3" />
                           </button>
                       </div>
                        <div className="text-right w-32">
                           <p className="text-2xl font-black tracking-tighter text-fg-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">₹{item.price.toLocaleString()} / Technician</p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="py-24 text-center glass-card rounded-[3rem] border-dashed border-2 border-border-base">
                 <ShoppingCart className="h-16 w-16 text-fg-dim mx-auto mb-6" />
                 <h2 className="text-2xl font-black uppercase mb-4 text-fg-primary">Cart is Empty</h2>
                 <Link href="/products" className="text-blue-500 font-black uppercase tracking-widest text-xs hover:underline">Browse Products</Link>
               </div>
            )}
          </div>

          {/* Summary */}
          <div className="w-full lg:w-96">
            <div className="glass-card p-10 rounded-[3rem] sticky top-32 space-y-8 border-blue-600/20">
               <h2 className="text-2xl font-black uppercase tracking-tight text-fg-primary">Order <span className="text-blue-500">Summary</span></h2>
               
               <div className="space-y-4">
                 <div className="flex justify-between text-sm">
                   <span className="text-fg-muted font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                   <span className="font-black text-fg-primary">₹{subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-fg-muted font-bold uppercase tracking-widest text-[10px]">Tax (18% GST)</span>
                   <span className="font-black text-fg-primary">₹{tax.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-fg-muted font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                   <span className="text-green-500 font-black uppercase tracking-widest text-[10px]">Free</span>
                 </div>
                 <div className="flex justify-between items-end">
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-fg-primary">Total Amount</span>
                   <span className="text-4xl font-black tracking-tighter text-blue-500">₹{total.toLocaleString()}</span>
                 </div>
               </div>

               <button 
                 onClick={handleCheckout}
                 disabled={loading || cartItems.length === 0}
                 className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>{checkoutStep === 'cart' ? 'Proceed to Delivery' : 'Place Secure Order'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>

               <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4 text-[10px] font-black text-fg-muted uppercase tracking-widest">
                     <ShieldCheck className="h-4 w-4 text-blue-500" />
                     Secure Payment
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-fg-muted uppercase tracking-widest">
                     <Truck className="h-4 w-4 text-blue-500" />
                     Free Delivery
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
