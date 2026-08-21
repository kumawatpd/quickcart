import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'
import Papa from 'papaparse'
import { z } from 'zod'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Leaf,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'

const products = [
  { id: 'p1', name: 'Ceramic pour-over set', category: 'Kitchen', price: 34, rating: 4.9, badge: 'Bestseller', color: 'sage', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=85' },
  { id: 'p2', name: 'Cloud knit throw', category: 'Home', price: 68, rating: 4.8, badge: 'New in', color: 'clay', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85' },
  { id: 'p3', name: 'Cedar & smoke candle', category: 'Wellness', price: 24, rating: 4.7, badge: '', color: 'plum', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },
  { id: 'p4', name: 'Daily ritual journal', category: 'Stationery', price: 18, rating: 4.9, badge: 'Staff pick', color: 'butter', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85' },
  { id: 'p5', name: 'Linen market tote', category: 'Accessories', price: 29, rating: 4.8, badge: '', color: 'blue', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85' },
  { id: 'p6', name: 'Stoneware breakfast bowl', category: 'Kitchen', price: 22, rating: 4.6, badge: '', color: 'sand', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85' },
  { id: 'p7', name: 'Botanical hand wash', category: 'Wellness', price: 16, rating: 4.7, badge: 'Refillable', color: 'green', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85' },
  { id: 'p8', name: 'Amber desk lamp', category: 'Home', price: 86, rating: 4.8, badge: '', color: 'amber', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85' },
]

const seedOrders = [
  { id: 'QC-1048', date: '2026-08-16T10:30:00', status: 'Delivered', items: [{ name: 'Cloud knit throw', quantity: 1, price: 68 }, { name: 'Cedar & smoke candle', quantity: 2, price: 24 }], total: 122 },
  { id: 'QC-1039', date: '2026-08-03T15:10:00', status: 'Delivered', items: [{ name: 'Ceramic pour-over set', quantity: 1, price: 34 }, { name: 'Daily ritual journal', quantity: 2, price: 18 }], total: 70 },
]

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email'),
  address: z.string().trim().min(8, 'Please enter your delivery address'),
})

const money = (value) => `$${value.toFixed(2)}`
const readStorage = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('shop')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All items')
  const [cart, setCart] = useState(() => readStorage('quickcart-cart', []))
  const [orders, setOrders] = useState(() => readStorage('quickcart-orders', seedOrders))
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => window.localStorage.setItem('quickcart-cart', JSON.stringify(cart)), [cart])
  useEffect(() => window.localStorage.setItem('quickcart-orders', JSON.stringify(orders)), [orders])
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const categories = ['All items', ...new Set(products.map((product) => product.category))]
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'All items' || product.category === category
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [category, query])
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= 75 ? 0 : 6
  const total = subtotal + shipping

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1 }]
    })
    setNotice(`${product.name} added to cart`)
  }

  const updateQuantity = (id, change) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item]
    const quantity = item.quantity + change
    return quantity > 0 ? [{ ...item, quantity }] : []
  }))

  const placeOrder = (event) => {
    event.preventDefault()
    const result = checkoutSchema.safeParse(form)
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }
    const order = {
      id: `QC-${nanoid(5).toUpperCase()}`,
      date: new Date().toISOString(),
      status: 'Processing',
      items: cart.map(({ name, quantity, price }) => ({ name, quantity, price })),
      total,
    }
    setOrders((current) => [order, ...current])
    setCart([])
    setCheckoutOpen(false)
    setForm({ name: '', email: '', address: '' })
    setErrors({})
    setActiveTab('orders')
    setNotice(`Order ${order.id} placed successfully`)
  }

  const exportOrders = () => {
    const rows = orders.flatMap((order) => order.items.map((item) => ({
      order_id: order.id,
      date: format(new Date(order.date), 'yyyy-MM-dd'),
      status: order.status,
      item: item.name,
      quantity: item.quantity,
      item_total: money(item.price * item.quantity),
      order_total: money(order.total),
    })))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'quickcart-orders.csv'
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Order history exported')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => setActiveTab('shop')}><span className="brand-mark"><Leaf size={17} strokeWidth={2.5} /></span>quickcart</a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeTab === 'shop' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab('shop')}>Shop</button>
          <button className={activeTab === 'orders' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab('orders')}>Your orders</button>
        </nav>
        <button className="cart-button" onClick={() => document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} aria-label={`View cart with ${cartCount} items`}>
          <ShoppingBag size={18} /> <span>Cart</span><b>{cartCount}</b>
        </button>
      </header>

      {notice && <div className="toast" role="status"><Check size={16} /> {notice}</div>}

      <main id="top">
        {activeTab === 'shop' ? <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow"><Sparkles size={14} /> Curated for everyday</p>
              <h1>Good things,<br /><em>made simple.</em></h1>
              <p className="hero-description">A considered collection of useful, beautiful objects for slower mornings and better days.</p>
              <button className="hero-action" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>Explore the collection <ArrowRight size={17} /></button>
            </div>
            <div className="hero-art"><img src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=1300&q=90" alt="Sunlit table with carefully chosen home goods" /><div className="hero-note">Small rituals<br /><strong>matter.</strong></div></div>
          </section>

          <section className="shop-layout" id="catalog">
            <div className="catalog-column">
              <div className="section-heading"><div><p className="eyebrow">The edit</p><h2>Shop all pieces</h2></div><span className="product-count">{filteredProducts.length} pieces</span></div>
              <div className="toolbar">
                <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" aria-label="Search products" /></div>
                <div className="category-list">{categories.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}</div>
              </div>
              <div className="product-grid">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
              </div>
              {filteredProducts.length === 0 && <div className="empty-search"><Search size={24} /><p>No pieces match that search.</p><button onClick={() => { setQuery(''); setCategory('All items') }}>Clear filters</button></div>}
            </div>
            <CartPanel cart={cart} subtotal={subtotal} shipping={shipping} total={total} onUpdate={updateQuantity} onCheckout={() => setCheckoutOpen(true)} />
          </section>
        </> : <OrdersView orders={orders} onExport={exportOrders} />}
      </main>

      <footer><span>quickcart</span><span>Thoughtful goods, delivered simply.</span><span>© 2026</span></footer>
      {checkoutOpen && <CheckoutModal form={form} errors={errors} total={total} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} onClose={() => setCheckoutOpen(false)} onSubmit={placeOrder} />}
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  return <article className="product-card">
    <div className={`product-image ${product.color}`}><img src={product.image} alt={product.name} loading="lazy" />{product.badge && <span className="badge">{product.badge}</span>}<button className="quick-add" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><Plus size={18} /></button></div>
    <div className="product-info"><div><h3>{product.name}</h3><p>{product.category}</p></div><strong>{money(product.price)}</strong></div>
    <div className="rating">★ {product.rating}</div>
  </article>
}

function CartPanel({ cart, subtotal, shipping, total, onUpdate, onCheckout }) {
  return <aside className="cart-panel" id="cart-panel"><div className="cart-heading"><div><p className="eyebrow">Your selection</p><h2>Shopping cart</h2></div><ShoppingBag size={21} /></div>
    {cart.length === 0 ? <div className="cart-empty"><div className="empty-bag"><ShoppingBag size={24} /></div><h3>Your cart is quiet.</h3><p>Add something useful and beautiful to get started.</p></div> : <>
      <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-detail"><h3>{item.name}</h3><p>{money(item.price)}</p><div className="quantity"><button onClick={() => onUpdate(item.id, -1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => onUpdate(item.id, 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={13} /></button></div></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div>
      <div className="cart-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Shipping</span><strong>{shipping === 0 ? 'Free' : money(shipping)}</strong></div><div className="total-line"><span>Total</span><strong>{money(total)}</strong></div></div><button className="checkout-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={17} /></button><p className="shipping-note"><Truck size={14} /> Free shipping on orders over $75</p>
    </>}
  </aside>
}

function OrdersView({ orders, onExport }) {
  return <section className="orders-page"><div className="orders-header"><div><p className="eyebrow">A little paper trail</p><h1>Your orders</h1><p>Everything you have brought home from QuickCart.</p></div><button className="outline-button" onClick={onExport} disabled={!orders.length}><Download size={16} /> Export CSV</button></div><div className="orders-list">{orders.length === 0 ? <div className="orders-empty"><PackageCheck size={30} /><h2>No orders yet</h2><p>Your next thoughtful find will show up here.</p></div> : orders.map((order) => <article className="order-row" key={order.id}><div className="order-icon"><PackageCheck size={20} /></div><div className="order-main"><div className="order-title"><h2>{order.id}</h2><span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></div><p>{format(new Date(order.date), 'MMMM d, yyyy')} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p><div className="order-items">{order.items.map((item) => <span key={item.name}>{item.quantity} × {item.name}</span>)}</div></div><strong className="order-total">{money(order.total)}</strong><ChevronDown size={18} className="order-chevron" /></article>)}</div></section>
}

function CheckoutModal({ form, errors, total, onChange, onClose, onSubmit }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="close-button" onClick={onClose} aria-label="Close checkout"><X size={19} /></button><p className="eyebrow">Almost yours</p><h2 id="checkout-title">Complete your order</h2><p className="modal-intro">Just the essentials. We’ll use these details to get your order moving.</p><form onSubmit={onSubmit} noValidate><label>Full name<input value={form.name} onChange={(event) => onChange('name', event.target.value)} autoComplete="name" />{errors.name && <small>{errors.name[0]}</small>}</label><label>Email address<input type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} autoComplete="email" />{errors.email && <small>{errors.email[0]}</small>}</label><label>Delivery address<textarea value={form.address} onChange={(event) => onChange('address', event.target.value)} rows="3" autoComplete="street-address" />{errors.address && <small>{errors.address[0]}</small>}</label><button className="checkout-button" type="submit">Place order · {money(total)} <ArrowRight size={17} /></button></form></div></div>
}

export default App
