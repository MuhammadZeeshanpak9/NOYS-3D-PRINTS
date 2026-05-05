'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Mail, ShoppingBag, ClipboardList, Package, Users, Settings, Palette, Layers, Truck, Star, MessageSquare } from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-xl border-2 ${open ? 'border-blue-200' : 'border-slate-200'} shadow-sm overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={`p-2 rounded-lg ${section.color}`}>{section.icon}</div>
        <span className="flex-1 font-semibold text-slate-800 text-base">{section.title}</span>
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm text-slate-600 space-y-3">
          {section.content}
        </div>
      )}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2"><span className="text-blue-500 font-bold mt-0.5">•</span><span>{children}</span></li>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 text-sm">{children}</div>;
}

function Warn({ children }: { children: React.ReactNode }) {
  return <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-orange-700 text-sm">{children}</div>;
}

export default function AdminHelpPage() {
  const sections: Section[] = [
    {
      id: 'emails',
      icon: <Mail size={18} className="text-indigo-600" />,
      title: 'Emails — Where They Come From & Where They Go',
      color: 'bg-indigo-50',
      content: (
        <div className="space-y-3">
          <p>The platform sends emails automatically using your connected email service (Resend). All system emails are sent <strong>from</strong> your address <strong>orders@noys3dprints.co.uk</strong>.</p>
          <p className="font-semibold text-slate-700">Emails sent automatically:</p>
          <ul className="space-y-2">
            <Li><strong>New order placed</strong> — You receive an email at orders@noys3dprints.co.uk with the order details.</Li>
            <Li><strong>Order confirmation</strong> — Customer receives a confirmation email when their order is placed.</Li>
            <Li><strong>Status update</strong> — Customer receives an email each time you move their order to a new status (Processing, Shipped, Delivered).</Li>
          </ul>
          <Note>To read these emails, simply log in to your email inbox at <strong>orders@noys3dprints.co.uk</strong>. All order notifications land there.</Note>
          <p className="font-semibold text-slate-700">Contact form messages:</p>
          <ul className="space-y-2">
            <Li>When a visitor fills in the Contact Us form on the website, their message is emailed directly to orders@noys3dprints.co.uk. Check your inbox to read and reply.</Li>
          </ul>
        </div>
      ),
    },
    {
      id: 'customer-orders',
      icon: <ShoppingBag size={18} className="text-orange-600" />,
      title: 'Customer Orders — Managing Shop Purchases',
      color: 'bg-orange-50',
      content: (
        <div className="space-y-3">
          <p>These are standard shop orders — customers browse the shop, add items to their cart, and checkout.</p>
          <p className="font-semibold text-slate-700">Order pipeline:</p>
          <ul className="space-y-2">
            <Li><strong>New Orders</strong> — Fresh orders waiting for you to action.</Li>
            <Li><strong>Processing</strong> — You've started working on the order (printing, preparing).</Li>
            <Li><strong>Shipped</strong> — The order has been sent to the customer.</Li>
            <Li><strong>Delivered</strong> — Customer has received their order.</Li>
            <Li><strong>Cancelled</strong> — Order was cancelled.</Li>
          </ul>
          <p className="font-semibold text-slate-700">How to move an order:</p>
          <ul className="space-y-2">
            <Li>Open <strong>Customer Orders</strong> in the sidebar.</Li>
            <Li>Click the tab for the current status (e.g. <em>New Orders</em>).</Li>
            <Li>Find the order and click <strong>"Move to Processing"</strong> to advance it.</Li>
            <Li>The customer is automatically emailed when you update the status.</Li>
          </ul>
          <Note>Each time you advance an order, the customer receives an automatic email update.</Note>
        </div>
      ),
    },
    {
      id: 'custom-orders',
      icon: <ClipboardList size={18} className="text-purple-600" />,
      title: 'Custom Orders — 3D Print Requests from the Builder',
      color: 'bg-purple-50',
      content: (
        <div className="space-y-3">
          <p>Custom orders are placed by customers using the <strong>"Order a Model"</strong> feature on the website. Customers upload or configure their 3D model, choose size, finish, and painting options, then submit a request.</p>
          <p className="font-semibold text-slate-700">How to manage custom orders:</p>
          <ul className="space-y-2">
            <Li>Go to <strong>Custom Orders</strong> in the sidebar to see all requests.</Li>
            <Li>Click on an order to view full details — model specs, size, finish, painting tier, and any notes.</Li>
            <Li>Update the status as you progress (Pending → In Review → Printing → Shipped → Delivered).</Li>
            <Li>You can add internal notes to each custom order for your own reference.</Li>
          </ul>
          <Note>Custom orders are separate from shop orders. A customer can place both types at the same time.</Note>
        </div>
      ),
    },
    {
      id: 'products',
      icon: <Package size={18} className="text-blue-600" />,
      title: 'Products & Categories',
      color: 'bg-blue-50',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-700">Adding a product:</p>
          <ul className="space-y-2">
            <Li>Go to <strong>Products</strong> → click <strong>"Add Product"</strong>.</Li>
            <Li>Fill in the name, description, price, and upload an image.</Li>
            <Li>Assign it to a category so it appears in the correct section of the shop.</Li>
            <Li>Toggle <strong>Active</strong> to make it visible on the site.</Li>
          </ul>
          <p className="font-semibold text-slate-700">Categories:</p>
          <ul className="space-y-2">
            <Li>Go to <strong>Categories</strong> to create and manage product categories.</Li>
            <Li>Products without a category won't appear in filtered views.</Li>
          </ul>
          <Warn>Deleting a category does not delete the products inside it — they just become uncategorised.</Warn>
        </div>
      ),
    },
    {
      id: 'configuration',
      icon: <Layers size={18} className="text-teal-600" />,
      title: 'Finish Options, Painting Tiers & Paint Colours',
      color: 'bg-teal-50',
      content: (
        <div className="space-y-3">
          <p>These three sections control what customers can choose when placing a custom 3D print order through the builder.</p>
          <p className="font-semibold text-slate-700">Finish Options:</p>
          <ul className="space-y-2">
            <Li>Controls the surface finish types available (e.g. Matte, Gloss, Primed).</Li>
            <Li>Each has a base price that is added to the order total.</Li>
            <Li>Mark as <strong>Inactive</strong> to hide it from customers without deleting it.</Li>
          </ul>
          <p className="font-semibold text-slate-700">Painting Tiers:</p>
          <ul className="space-y-2">
            <Li>Controls the painting service levels (e.g. Basic, Standard, Premium).</Li>
            <Li>Use <strong>Sort Order</strong> to control the display order (0 = first).</Li>
          </ul>
          <p className="font-semibold text-slate-700">Paint Colours:</p>
          <ul className="space-y-2">
            <Li>The specific colours customers can select for their model.</Li>
            <Li>Use the colour picker to set the exact hex colour — this is shown as a swatch to customers.</Li>
          </ul>
        </div>
      ),
    },
    {
      id: 'users',
      icon: <Users size={18} className="text-green-600" />,
      title: 'Users',
      color: 'bg-green-50',
      content: (
        <div className="space-y-3">
          <p>The Users section shows everyone who has registered on the website.</p>
          <ul className="space-y-2">
            <Li>You can view each user's name, email, registration date, and subscription plan.</Li>
            <Li>To make someone an admin, their <strong>role</strong> must be set to <code className="bg-slate-100 px-1 rounded">admin</code> — contact your developer to do this.</Li>
          </ul>
          <Note>Customers manage their own accounts (name, shipping address, password) from their profile page on the website.</Note>
        </div>
      ),
    },
    {
      id: 'delivery',
      icon: <Truck size={18} className="text-slate-600" />,
      title: 'Delivery Settings',
      color: 'bg-slate-100',
      content: (
        <div className="space-y-3">
          <p>Delivery Settings lets you configure shipping options and rates shown to customers at checkout.</p>
          <ul className="space-y-2">
            <Li>Add different delivery methods (e.g. Standard, Express).</Li>
            <Li>Set prices and estimated delivery times for each.</Li>
            <Li>Toggle active/inactive to show or hide a delivery option.</Li>
          </ul>
        </div>
      ),
    },
    {
      id: 'plans',
      icon: <Star size={18} className="text-yellow-600" />,
      title: 'Plans & Pricing',
      color: 'bg-yellow-50',
      content: (
        <div className="space-y-3">
          <p>Plans are subscription tiers shown on the Pricing page of the website.</p>
          <ul className="space-y-2">
            <Li>Go to <strong>Plans</strong> to edit plan names, prices, and included features.</Li>
            <Li>Customers can subscribe to a plan from the Pricing page on the website.</Li>
            <Li>Each plan can have its own set of benefits listed (shown as bullet points on the pricing page).</Li>
          </ul>
        </div>
      ),
    },
    {
      id: 'settings',
      icon: <Settings size={18} className="text-blue-600" />,
      title: 'Settings — Change Your Email & Password',
      color: 'bg-blue-50',
      content: (
        <div className="space-y-3">
          <p>Go to <strong>Settings</strong> in the sidebar to update your admin credentials.</p>
          <p className="font-semibold text-slate-700">Change Email:</p>
          <ul className="space-y-2">
            <Li>Enter your new email address and confirm with your current password.</Li>
            <Li>You will use the new email to log in going forward.</Li>
          </ul>
          <p className="font-semibold text-slate-700">Change Password:</p>
          <ul className="space-y-2">
            <Li>Enter your current password, then your new password twice to confirm.</Li>
          </ul>
          <Warn>After changing your email or password, you will be logged out and need to sign in again with the new credentials.</Warn>
        </div>
      ),
    },
    {
      id: 'contact',
      icon: <MessageSquare size={18} className="text-pink-600" />,
      title: 'Contact Form Messages',
      color: 'bg-pink-50',
      content: (
        <div className="space-y-3">
          <p>When a visitor submits the <strong>Contact Us</strong> form on the website, their message is sent to your inbox at <strong>orders@noys3dprints.co.uk</strong>.</p>
          <ul className="space-y-2">
            <Li>Check your email inbox to read and reply to customer enquiries.</Li>
            <Li>The message includes the customer's name, email address, and their message.</Li>
            <Li>Reply directly from your email client to respond to them.</Li>
          </ul>
          <Note>You do not need to check the admin panel for contact messages — they go straight to your email inbox.</Note>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Help & Guide</h1>
        <p className="text-sm text-slate-500 mt-1">Everything you need to know about managing your Noys 3D Prints dashboard.</p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold mb-1">Welcome to your Admin Dashboard</h2>
        <p className="text-blue-100 text-sm">Use the sections below to learn how each part of the dashboard works. Click any section to expand it.</p>
      </div>

      <div className="space-y-3">
        {sections.map(s => <Accordion key={s.id} section={s} />)}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">Need more help?</p>
        <p>Contact your developer at <strong>muhammadzeeshanpak9@gmail.com</strong> for any technical issues or questions about the platform.</p>
      </div>
    </div>
  );
}
