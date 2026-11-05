import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart,
  Leaf, Menu, Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star,
  Truck, X,
} from "lucide-react";
import { api, clearTokens, hasSession, login, register } from "./api.js";
import { sampleCategories, sampleProducts } from "./sampleCatalog.js";

const money = (value) => `$${Number(value).toFixed(2)}`;

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(200);
  const [activeProduct, setActiveProduct] = useState(null);
  const [panel, setPanel] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(hasSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [notice, setNotice] = useState("");

  const loadCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);
      params.set("max_price", maxPrice);
      const [items, groups] = await Promise.all([
        api(`/products/?${params.toString()}`),
        api("/categories/"),
      ]);
      setProducts(items);
      setCategories(groups);
      setPreviewMode(false);
    } catch (requestError) {
      setProducts(sampleProducts);
      setCategories(sampleCategories);
      setPreviewMode(true);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivateData = async () => {
    if (!hasSession()) {
      setCart([]);
      setOrders([]);
      return;
    }
    try {
      const [items, history] = await Promise.all([api("/cart/"), api("/orders/")]);
      setCart(items);
      setOrders(history);
    } catch {
      clearTokens();
      setUser(false);
      setCart([]);
      setOrders([]);
    }
  };

  useEffect(() => { loadCatalog(); }, [search, category, maxPrice]);
  useEffect(() => { loadPrivateData(); }, [user]);

  const sortedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = products.filter((product) => (
      (category === "all" || product.category.slug === category)
      && Number(product.price) <= maxPrice
      && (!query || `${product.name} ${product.description}`.toLowerCase().includes(query))
    ));
    if (sort === "price-low") sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating") sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    return sorted;
  }, [products, sort]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.line_total), 0);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const addToCart = async (product) => {
    if (previewMode) {
      notify("This is a catalog preview. Connect the Django API to enable accounts and checkout.");
      return;
    }
    if (!user) {
      setActiveProduct(null);
      setAuthMode("login");
      setPanel("auth");
      notify("Sign in to add items to your bag.");
      return;
    }
    try {
      await api("/cart/", { method: "POST", body: JSON.stringify({ product_id: product.id, quantity: 1 }) });
      await loadPrivateData();
      setActiveProduct(null);
      setPanel("cart");
      notify("Added to your bag");
    } catch (requestError) {
      notify(requestError.message);
    }
  };

  const updateQuantity = async (item, quantity) => {
    try {
      if (quantity < 1) await api(`/cart/${item.id}/`, { method: "DELETE" });
      else await api(`/cart/${item.id}/`, { method: "PATCH", body: JSON.stringify({ quantity }) });
      await loadPrivateData();
    } catch (requestError) {
      notify(requestError.message);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (authMode === "register") {
        await register({
          username: form.get("username"),
          email: form.get("email"),
          password: form.get("password"),
        });
      } else {
        await login(form.get("username"), form.get("password"));
      }
      setUser(true);
      setPanel("");
      notify(authMode === "register" ? "Welcome to Good Things." : "Welcome back.");
    } catch (requestError) {
      notify(requestError.message);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    const shipping = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const order = await api("/checkout/", { method: "POST", body: JSON.stringify(shipping) });
      await loadPrivateData();
      setPanel("orders");
      notify(`Order #${order.id} placed — thank you!`);
    } catch (requestError) {
      notify(requestError.message);
    }
  };

  return (
    <>
      <div className="announcement" id="top">
        <Sparkles size={13} /> A little more thoughtful. A little more you. <span>Free shipping over $75</span>
      </div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Good Things home"><span className="brand-mark">g.</span> good things</a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#shop">Shop all</a>
          <a href="#shop" onClick={() => setCategory("home")}>Home</a>
          <a href="#shop" onClick={() => setCategory("accessories")}>Accessories</a>
          <a href="#about">Our story</a>
        </nav>
        <div className="header-actions">
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>
            <Search size={17} />
            <input aria-label="Search products" placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
          </form>
          <button className="icon-button account-button" onClick={() => { setPanel(user ? "orders" : "auth"); setAuthMode("login"); }} aria-label={user ? "Your orders" : "Sign in"}>
            {user ? <span className="avatar">G</span> : <span className="account-label">Sign in</span>}
          </button>
          {user && <button className="logout-button" onClick={() => { clearTokens(); setUser(false); notify("You are signed out."); }}>Sign out</button>}
          <button className="icon-button bag-button" onClick={() => setPanel("cart")} aria-label={`Shopping bag, ${cartCount} items`}>
            <ShoppingBag size={21} /><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}
          </button>
          <button className="icon-button mobile-menu" onClick={() => setPanel("menu")} aria-label="Open menu"><Menu size={21} /></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <img className="hero-image" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2200&q=90" alt="Warm, thoughtfully styled living room" />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow light"><span /> THE EVERYDAY EDIT</span>
            <h1>Make room<br />for <em>good things.</em></h1>
            <p>Thoughtful essentials for the way you really live — made to be used, loved, and kept.</p>
            <a className="button button-light" href="#shop">Shop the collection <ArrowRight size={16} /></a>
          </div>
          <span className="hero-count">01 <span /> 03</span>
          <div className="hero-caption">Live well. Keep it simple.</div>
        </section>

        <section className="promise-row" id="about">
          <div className="promise"><Leaf /><div><b>Considered by nature</b><span>Better materials, less waste</span></div></div>
          <div className="promise"><Sparkles /><div><b>Made for everyday</b><span>Useful things, beautifully done</span></div></div>
          <div className="promise"><Truck /><div><b>A little treat, on us</b><span>Complimentary shipping over $75</span></div></div>
          <div className="promise"><ShieldCheck /><div><b>Shopping, made easy</b><span>30 days to find your fit</span></div></div>
        </section>

        <section className="shop-section" id="shop">
          {previewMode && <div className="preview-banner"><span><strong>Store preview</strong> Browsing is available; accounts, cart, and checkout need the Django API to be deployed.</span><button onClick={loadCatalog}>Retry connection</button></div>}
          <div className="section-top">
            <div>
              <span className="eyebrow"><span /> THE GOOD SHOP</span>
              <h2>Things you'll <em>keep.</em></h2>
              <p>Little upgrades for the rhythms of everyday life.</p>
            </div>
            <a className="text-link" href="#shop" onClick={() => { setCategory("all"); setSearch(""); }}>Explore everything <ArrowUpRight size={15} /></a>
          </div>
          <div className="shop-toolbar">
            <div className="category-pills">
              <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All things <span>{products.length}</span></button>
              {categories.map((item) => (
                <button key={item.id} className={category === item.slug ? "active" : ""} onClick={() => setCategory(item.slug)}>{item.name}</button>
              ))}
            </div>
            <label className="sort-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={14} /></label>
          </div>
          <div className="filter-line">
            <label htmlFor="price-filter">Up to {money(maxPrice)}</label>
            <input id="price-filter" type="range" min="25" max="200" step="5" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} />
            <button onClick={() => setMaxPrice(200)}>Clear filters <X size={13} /></button>
          </div>
          {error && <div className="error-banner">{error}<button onClick={loadCatalog}>Try again</button></div>}
          {loading ? <div className="loading-state"><span className="spinner" /> Finding good things...</div> : (
            <div className="product-grid">
              {sortedProducts.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <button className="product-image-wrap" onClick={() => setActiveProduct(product)} aria-label={`View ${product.name}`}>
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                    {product.featured && <span className="product-badge">A good favorite</span>}
                    <span className="quick-view">Quick view <ArrowUpRight size={14} /></span>
                  </button>
                  <div className="product-info">
                    <div className="product-meta"><span>{product.category.name}</span><span className="rating"><Star size={12} fill="currentColor" /> {Number(product.rating).toFixed(1)}</span></div>
                    <button className="product-name" onClick={() => setActiveProduct(product)}>{product.name}</button>
                    <div className="product-bottom"><span className="price">{money(product.price)}</span><button className="add-button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to bag`} disabled={!product.stock || previewMode} title={previewMode ? "Connect the Django API to enable checkout" : ""}><Plus size={16} /> <span>{previewMode ? "Preview" : "Add"}</span></button></div>
                  </div>
                </article>
              ))}
              {!sortedProducts.length && <div className="empty-products"><span>Nothing here just yet.</span><p>Try a different search or clear your filters.</p><button className="text-link" onClick={() => { setSearch(""); setCategory("all"); setMaxPrice(200); }}>Show everything <ArrowRight size={15} /></button></div>}
            </div>
          )}
        </section>

        <section className="story-banner">
          <div className="story-photo"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="A sunny, calm corner at home" /></div>
          <div className="story-copy"><span className="eyebrow"><span /> A NOTE FROM US</span><h2>Good things,<br /><em>good days.</em></h2><p>We believe the things you live with should make life feel a little better. So we seek out pieces with purpose, made by people who care.</p><a className="text-link" href="#about">A little about us <ArrowRight size={15} /></a></div>
        </section>

        <section className="newsletter">
          <span className="eyebrow light"><span /> A LITTLE REMINDER</span>
          <h2>Make room for <em>good days.</em></h2>
          <p>Find thoughtful things for all the everyday moments.</p>
          <a className="button button-light" href="#shop">Find your next favorite <ArrowRight size={15} /></a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><a className="brand" href="#"><span className="brand-mark">g.</span> good things</a><p>Thoughtful essentials for a life well lived.</p><span className="social-note">Find us in the little moments. <Heart size={13} /></span></div>
          <div className="footer-links"><b>Come on in</b><a href="#shop">Shop all</a><a href="#shop" onClick={() => setCategory("home")}>Home & living</a><a href="#shop" onClick={() => setCategory("accessories")}>Accessories</a><a href="#about">Our story</a></div>
          <div className="footer-links"><b>Here to help</b><a href="mailto:hello@goodthings.example">Contact us</a><a href="mailto:hello@goodthings.example?subject=Shipping%20and%20returns">Shipping & returns</a><a href="mailto:hello@goodthings.example?subject=Frequently%20asked%20questions">FAQs</a><a href="mailto:hello@goodthings.example?subject=Privacy">Privacy</a></div>
          <div className="footer-contact"><b>Say hello</b><a href="mailto:hello@goodthings.example">hello@goodthings.example</a><span>Monday–Friday, 9–5 (PT)</span><span>Portland, Oregon</span></div>
        </div>
        <div className="footer-bottom"><span>© 2025 Good Things Supply Co.</span><span>Made for the moments in between <span className="tiny-heart">♥</span></span><a href="#top">Back to top ↑</a></div>
      </footer>

      {activeProduct && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveProduct(null); }}>
        <section className="product-modal" role="dialog" aria-modal="true" aria-label={activeProduct.name}>
          <button className="close-button" onClick={() => setActiveProduct(null)} aria-label="Close"><X /></button>
          <div className="modal-image"><img src={activeProduct.image_url} alt={activeProduct.name} /></div>
          <div className="modal-details"><span className="eyebrow"><span /> {activeProduct.category.name.toUpperCase()}</span><h2>{activeProduct.name}</h2><div className="modal-rating"><Star size={15} fill="currentColor" /> {Number(activeProduct.rating).toFixed(1)} <span>· Loved by our community</span></div><p>{activeProduct.description}</p><div className="modal-price">{money(activeProduct.price)}</div><button className="button button-dark full-button" onClick={() => addToCart(activeProduct)} disabled={!activeProduct.stock || previewMode}>{previewMode ? "Preview only" : activeProduct.stock ? "Add to bag" : "Out of stock"} <ArrowRight size={16} /></button><small><Truck size={15} /> Free shipping on orders over $75</small></div>
        </section>
      </div>}

      {panel && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(""); }}>
        <aside className={`drawer ${panel === "auth" ? "auth-drawer" : ""}`} role="dialog" aria-modal="true">
          <div className="drawer-header"><div><span className="eyebrow"><span /> GOOD THINGS</span><h3>{panel === "cart" ? "Your bag" : panel === "checkout" ? "A few details" : panel === "orders" ? "Your orders" : panel === "auth" ? (authMode === "login" ? "Welcome back." : "Join the good list.") : "Come on in"}</h3></div><button className="close-button" onClick={() => setPanel("")} aria-label="Close"><X /></button></div>
          {panel === "cart" && <div className="drawer-content">
            {cart.length ? <>
              <p className="drawer-subtitle">A few good things, just for you.</p>
              <div className="cart-list">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.product.image_url} alt="" /><div className="cart-item-info"><span>{item.product.category.name}</span><b>{item.product.name}</b><strong>{money(item.product.price)}</strong><div className="quantity"><button aria-label="Remove one" onClick={() => updateQuantity(item, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Add one" onClick={() => updateQuantity(item, item.quantity + 1)}><Plus size={13} /></button></div></div><button className="remove-item" onClick={() => updateQuantity(item, 0)} aria-label="Remove item"><X size={16} /></button></div>)}</div>
              <div className="shipping-meter"><span>{subtotal >= 75 ? "You've unlocked free shipping!" : `You're ${money(75 - subtotal)} away from free shipping`}</span><div><i style={{ width: `${Math.min(100, subtotal / 75 * 100)}%` }} /></div></div>
              <div className="cart-totals"><span>Subtotal</span><b>{money(subtotal)}</b><small>Shipping calculated at checkout</small></div>
              <button className="button button-dark full-button" onClick={() => setPanel("checkout")}>Continue to checkout <ArrowRight size={16} /></button>
              <button className="continue-shopping" onClick={() => setPanel("")}><ArrowLeft size={14} /> Keep looking</button>
            </> : <div className="empty-cart"><ShoppingBag size={35} /><h4>Your bag is taking a breather.</h4><p>It could use a good thing or two.</p><button className="button button-dark" onClick={() => { setPanel(""); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Find your good thing <ArrowRight size={15} /></button></div>}
          </div>}
          {panel === "checkout" && <div className="drawer-content">
            <div className="checkout-review">{cart.map((item) => <div key={item.id}><span>{item.quantity} × {item.product.name}</span><b>{money(item.line_total)}</b></div>)}<div className="checkout-total"><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{subtotal >= 75 ? "Free" : "$6.00"}</b></div><div className="checkout-total"><span>Total</span><b>{money(subtotal + (subtotal >= 75 ? 0 : 6))}</b></div></div>
            <p className="checkout-note"><ShieldCheck size={16} /> No card details are collected here. This demo places an order for fulfillment.</p>
            <form className="checkout-form" onSubmit={placeOrder}><label>Full name<input name="full_name" required autoComplete="name" /></label><label>Email address<input name="email" type="email" required autoComplete="email" /></label><label>Street address<input name="address" required autoComplete="street-address" /></label><div className="form-row"><label>City<input name="city" required autoComplete="address-level2" /></label><label>Postal code<input name="postal_code" required autoComplete="postal-code" /></label></div><label>Country<input name="country" required autoComplete="country-name" /></label><button className="button button-dark full-button" type="submit">Place order <ArrowRight size={16} /></button><button type="button" className="continue-shopping" onClick={() => setPanel("cart")}><ArrowLeft size={14} /> Back to your bag</button></form>
          </div>}
          {panel === "auth" && <div className="drawer-content">
            <p className="drawer-subtitle">{authMode === "login" ? "Sign in to see your bag and past orders." : "Create an account to keep your good things together."}</p>
            <form className="checkout-form" onSubmit={handleAuth}><label>Username<input name="username" required autoComplete="username" /></label>{authMode === "register" && <label>Email address<input name="email" type="email" required autoComplete="email" /></label>}<label>Password<input name="password" type="password" required minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label><button className="button button-dark full-button" type="submit">{authMode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16} /></button></form>
            <p className="auth-switch">{authMode === "login" ? "New around here?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p>
          </div>}
          {panel === "orders" && <div className="drawer-content">
            {!user ? <div className="empty-cart"><p>Sign in to check in on your past orders.</p><button className="button button-dark" onClick={() => { setPanel("auth"); setAuthMode("login"); }}>Sign in <ArrowRight size={15} /></button></div> : orders.length ? <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-head"><b>Order #{order.id}</b><span className={`status status-${order.status}`}>{order.status}</span></div><small>{new Date(order.created_at).toLocaleDateString()}</small>{order.items.map((item, index) => <div className="order-line" key={index}><span>{item.quantity} × {item.product_name}</span><b>{money(Number(item.unit_price) * item.quantity)}</b></div>)}<div className="order-total"><span>Total</span><b>{money(order.total)}</b></div><p className="order-address">{order.full_name} · {order.address}, {order.city} {order.postal_code}, {order.country}</p></article>)}</div> : <div className="empty-cart"><ShoppingBag size={35} /><h4>No orders just yet.</h4><p>Good things are waiting to be found.</p><button className="button button-dark" onClick={() => { setPanel(""); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>Browse the shop <ArrowRight size={15} /></button></div>}
          </div>}
          {panel === "menu" && <div className="drawer-content menu-links"><a href="#shop" onClick={() => setPanel("")}>Shop all <ArrowRight size={16} /></a><a href="#shop" onClick={() => { setCategory("home"); setPanel(""); }}>Home <ArrowRight size={16} /></a><a href="#shop" onClick={() => { setCategory("accessories"); setPanel(""); }}>Accessories <ArrowRight size={16} /></a><a href="#about" onClick={() => setPanel("")}>Our story <ArrowRight size={16} /></a></div>}
        </aside>
      </div>}
      {notice && <div className="toast"><Check size={16} /> {notice}</div>}
    </>
  );
}

export default App;
