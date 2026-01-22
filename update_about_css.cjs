
const fs = require('fs');
const path = require('path');

const cssContent = `/* About Page New Styles */

.about-page-new {
  width: 100%;
  overflow-x: hidden;
  background-color: var(--color-background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Typography Helpers */
.text-gold {
  color: var(--color-gold);
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  color: var(--color-primary-dark);
  margin-bottom: 1.5rem;
}

.center {
  text-align: center;
}

/* Hero Section */
.about-hero {
  position: relative;
  height: 70vh;
  min-height: 500px;
  background-color: var(--color-primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: var(--color-white);
}

.about-hero-content {
  max-width: 800px;
  z-index: 2;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-family: 'Lato', sans-serif;
  font-size: 1.25rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 2rem;
}

.hero-divider {
  width: 60px;
  height: 3px;
  background-color: var(--color-gold);
  margin: 0 auto;
}

/* Sections General */
.about-section {
  padding: 6rem 0;
}

/* Origin Section */
.origin-section {
  background-color: var(--color-white);
}

.split-layout {
  display: flex;
  align-items: center;
  gap: 4rem;
  flex-wrap: wrap;
}

.split-layout .text-block {
  flex: 1;
  min-width: 300px;
}

.split-layout .visual-block {
  flex: 1;
  min-width: 300px;
  display: flex;
  justify-content: center;
}

.lead-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--color-text-main);
  margin-bottom: 1.5rem;
}

.date-card {
  border: 2px solid var(--color-primary);
  padding: 3rem;
  text-align: center;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 250px;
  height: 250px;
  box-shadow: 15px 15px 0px var(--color-gold-light);
}

.date-card .est {
  font-family: 'Lato', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
}

.date-card .year {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary-dark);
}

.date-card .date {
  font-family: 'Lato', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  margin-top: 0.5rem;
  color: var(--color-gold);
}

/* Philosophy Banner */
.philosophy-banner {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 5rem 2rem;
  text-align: center;
}

.philosophy-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  margin-bottom: 2rem;
}

.philosophy-item {
  text-align: center;
}

.philosophy-item h3 {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  color: var(--color-gold);
  line-height: 1;
}

.philosophy-item span {
  font-family: 'Lato', sans-serif;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 0.9rem;
  opacity: 0.8;
}

.philosophy-divider {
  width: 2px;
  height: 60px;
  background-color: var(--color-white);
  opacity: 0.3;
}

.philosophy-quote {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
  opacity: 0.9;
}

/* Ingredients Grid */
.ingredients-section-new {
  background-color: var(--color-background);
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
}

.ingredient-card {
  background: var(--color-white);
  padding: 2rem;
  text-align: center;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.ingredient-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  border-color: var(--color-gold);
}

.ingredient-card.highlight {
  background-color: var(--color-primary-dark);
  color: var(--color-white);
  border: none;
}

.ingredient-card.highlight h4 {
  color: var(--color-gold);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.ingredient-card h4 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  margin-bottom: 0;
}

/* Products Info Rows */
.products-info-section {
  background-color: var(--color-white);
  overflow: hidden; /* For animations coming from sides */
}

.product-feature-row {
  display: flex;
  align-items: stretch;
  gap: 4rem;
  margin-bottom: 6rem;
}

.product-feature-row.reverse {
  flex-direction: row-reverse;
}

.product-feature-row:last-child {
  margin-bottom: 0;
}

.feature-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-text h3 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
}

.feature-list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.8rem;
  color: var(--color-text-main);
}

.feature-list li::before {
  content: "•";
  color: var(--color-gold);
  position: absolute;
  left: 0;
  font-size: 1.5rem;
  line-height: 1;
  top: -2px;
}

.visual-block.frame-visual {
  flex: 1;
  min-height: 400px;
  position: relative;
  border: 1px solid var(--color-gold);
  padding: 1rem;
}

/* Placeholder styles replacing actual images with CSS art/blocks */
.frame-visual-1 .frame-inner {
  width: 100%;
  height: 100%;
  background-color: #e6e9e6; /* Placeholder color close to olive tint */
  background-image: linear-gradient(135deg, #e6e9e6 25%, #dce0db 25%, #dce0db 50%, #e6e9e6 50%, #e6e9e6 75%, #dce0db 75%, #dce0db 100%);
  background-size: 40px 40px;
}

.frame-visual-2 .frame-inner {
  width: 100%;
  height: 100%;
  background-color: #f7f3ec;
  background-image: radial-gradient(#d4c5a3 20%, transparent 20%),
                    radial-gradient(#d4c5a3 20%, transparent 20%);
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
}


/* Footer/Closing */
.about-footer {
  padding: 6rem 1rem;
  text-align: center;
  background-color: var(--color-background);
}

.about-footer h2 {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  color: var(--color-primary-dark);
  margin-bottom: 1rem;
}

.about-footer p {
  font-family: 'Lato', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-gold);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .split-layout, .product-feature-row, .product-feature-row.reverse {
    flex-direction: column;
    gap: 2rem;
  }
  
  .visual-block.frame-visual {
    min-height: 300px;
    width: 100%;
  }

  .philosophy-content {
    gap: 1.5rem;
  }
}
`;

const filePath = path.join('src', 'pages', 'About.css');
fs.writeFileSync(filePath, cssContent, 'utf8');
console.log('Successfully updated About.css');
