import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">
              Royal <span className="text-[hsl(var(--royal-gold))]">Pure</span> Spices
            </h3>
            <p className="text-sm text-muted-foreground">
              Bringing you the finest quality natural spices for authentic flavors and premium aroma.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-[hsl(var(--royal-gold))] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/product" className="text-muted-foreground hover:text-[hsl(var(--royal-gold))] transition-colors">
                  Product
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-[hsl(var(--royal-gold))] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-[hsl(var(--royal-gold))] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <p className="text-sm text-muted-foreground">
              Email: royalpurespicespvtltd.com<br />
              Phone: +91 9203605553
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Royal Pure Spices Pvt Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
