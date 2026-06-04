export interface Challenge {
  id: string;
  title: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  description: string;
  startHTML: string;
  startCSS: string;
  targetHTML: string;
  targetCSS: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'card-profile-1',
    title: 'Tarjeta de Perfil',
    difficulty: 'Fácil',
    description: 'Replica esta tarjeta de perfil con avatar, texto y botón.',
    startHTML: `<div class="card">
  <div class="avatar"></div>
  <h1>Bienvenido</h1>
  <p>Este es tu primer diseño</p>
  <button>Comenzar</button>
</div>`,
    startCSS: `/* Escribe tu CSS aquí */\n`,
    targetHTML: `<div class="card">
  <div class="avatar"></div>
  <h1>Bienvenido</h1>
  <p>Este es tu primer diseño</p>
  <button>Comenzar</button>
</div>`,
    targetCSS: `body {
  background: #dde3ec;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  font-family: sans-serif;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 48px 36px 36px;
  max-width: 280px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #5B8DB8;
  margin-bottom: 4px;
}

h1 {
  background: #c2d8ee;
  width: 140px;
  height: 14px;
  border-radius: 7px;
  font-size: 0;
  color: transparent;
  margin: 0;
}

p {
  background: #d8e9f7;
  width: 180px;
  height: 10px;
  border-radius: 5px;
  font-size: 0;
  color: transparent;
  margin: 0;
}

button {
  background: #5B8DB8;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 6px;
  transition: background 200ms;
}

button:hover {
  background: #4a7aa6;
}`,
  },
  {
    id: 'navbar-2',
    title: 'Barra de Navegación',
    difficulty: 'Medio',
    description: 'Replica esta barra de navegación con logo, links y botón.',
    startHTML: `<nav class="navbar">
  <div class="nav-logo">MyApp</div>
  <ul class="nav-links">
    <li><a href="#">Inicio</a></li>
    <li><a href="#">Productos</a></li>
    <li><a href="#">Nosotros</a></li>
  </ul>
  <button class="nav-cta">Comenzar</button>
</nav>`,
    startCSS: `/* Escribe tu CSS aquí */\n`,
    targetHTML: `<nav class="navbar">
  <div class="nav-logo">MyApp</div>
  <ul class="nav-links">
    <li><a href="#">Inicio</a></li>
    <li><a href="#">Productos</a></li>
    <li><a href="#">Nosotros</a></li>
  </ul>
  <button class="nav-cta">Comenzar</button>
</nav>`,
    targetCSS: `body {
  margin: 0;
  background: #f5f5f5;
  font-family: sans-serif;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.nav-logo {
  font-size: 20px;
  font-weight: 700;
  color: #6366f1;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 32px;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: #555;
  text-decoration: none;
  font-size: 15px;
  transition: color 200ms;
}

.nav-links a:hover {
  color: #6366f1;
}

.nav-cta {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms;
}

.nav-cta:hover {
  background: #4f46e5;
}`,
  },
  {
    id: 'pricing-card-3',
    title: 'Tarjeta de Precio',
    difficulty: 'Difícil',
    description: 'Replica esta tarjeta de precio con badge, lista de features y botón.',
    startHTML: `<div class="pricing-card">
  <div class="badge">Popular</div>
  <div class="plan">Pro</div>
  <div class="price">
    <span class="currency">$</span>
    <span class="amount">29</span>
    <span class="period">/mes</span>
  </div>
  <ul class="features">
    <li>Proyectos ilimitados</li>
    <li>10 GB almacenamiento</li>
    <li>Soporte prioritario</li>
    <li>Análisis avanzado</li>
  </ul>
  <button>Comenzar ahora</button>
</div>`,
    startCSS: `/* Escribe tu CSS aquí */\n`,
    targetHTML: `<div class="pricing-card">
  <div class="badge">Popular</div>
  <div class="plan">Pro</div>
  <div class="price">
    <span class="currency">$</span>
    <span class="amount">29</span>
    <span class="period">/mes</span>
  </div>
  <ul class="features">
    <li>Proyectos ilimitados</li>
    <li>10 GB almacenamiento</li>
    <li>Soporte prioritario</li>
    <li>Análisis avanzado</li>
  </ul>
  <button>Comenzar ahora</button>
</div>`,
    targetCSS: `body {
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: sans-serif;
}

.pricing-card {
  background: white;
  border-radius: 24px;
  padding: 36px 32px;
  max-width: 300px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.plan {
  font-size: 14px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  margin-top: 8px;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 24px;
}

.currency {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.amount {
  font-size: 48px;
  font-weight: 800;
  color: #333;
  line-height: 1;
}

.period {
  font-size: 16px;
  color: #888;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555;
  font-size: 14px;
}

.features li::before {
  content: '✓';
  color: #667eea;
  font-weight: 700;
  font-size: 16px;
}

button {
  width: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 200ms;
}

button:hover {
  opacity: 0.9;
}`,
  },
];
