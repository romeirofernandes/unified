import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-[#404040] mt-32 py-8">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center text-[#e5e5e5]/50 text-sm">
          <p>© {new Date().getFullYear()} Unified. All rights reserved.</p>
          <p>Crafted by Romeiro Fernandes</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
