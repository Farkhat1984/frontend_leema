#!/usr/bin/env python3
"""
Script to update admin and shop pages to use modern Tailwind CSS design
Based on the style from logs, reports, and reviews pages
"""

import os
import re
from pathlib import Path

# Navigation template for admin pages
ADMIN_NAV_TEMPLATE = """    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <div class="flex items-center">
                        <i class="fas fa-shield-alt text-purple-600 text-2xl mr-3"></i>
                        <span class="text-xl font-bold text-gray-900">Admin Panel</span>
                    </div>
                    <div class="hidden md:flex space-x-4">
                        <a href="../index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-home mr-2"></i>Dashboard
                        </a>
                        <a href="../products/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-box mr-2"></i>Products
                        </a>
                        <a href="../shops/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-store mr-2"></i>Shops
                        </a>
                        <a href="../orders/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-shopping-cart mr-2"></i>Orders
                        </a>
                        <a href="../logs/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-history mr-2"></i>Logs
                        </a>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative" id="notificationBell">
                        <button class="text-gray-600 hover:text-gray-900 relative">
                            <i class="fas fa-bell text-xl"></i>
                            <span id="notificationBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
                        </button>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-right">
                            <p class="text-sm font-medium text-gray-900" id="adminName">Admin</p>
                            <p class="text-xs text-gray-500">Administrator</p>
                        </div>
                        <button onclick="logout()" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-sign-out-alt text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>"""

# Navigation template for shop pages
SHOP_NAV_TEMPLATE = """    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <div class="flex items-center">
                        <i class="fas fa-store text-purple-600 text-2xl mr-3"></i>
                        <span class="text-xl font-bold text-gray-900">Shop Panel</span>
                    </div>
                    <div class="hidden md:flex space-x-4">
                        <a href="../index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-home mr-2"></i>Dashboard
                        </a>
                        <a href="../products/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-box mr-2"></i>Products
                        </a>
                        <a href="../orders/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-shopping-cart mr-2"></i>Orders
                        </a>
                        <a href="../analytics/index.html" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-chart-line mr-2"></i>Analytics
                        </a>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative" id="notificationBell">
                        <button class="text-gray-600 hover:text-gray-900 relative">
                            <i class="fas fa-bell text-xl"></i>
                            <span id="notificationBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
                        </button>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-right">
                            <p class="text-sm font-medium text-gray-900" id="shopName">My Shop</p>
                            <p class="text-xs text-gray-500">Shop Owner</p>
                        </div>
                        <button onclick="logout()" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-sign-out-alt text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>"""

def get_head_template(title):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50">"""

def get_logout_script():
    return """
    <script>
        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '../../index.html';
        }
    </script>"""

def update_page_if_needed(file_path, page_type):
    """Update a page file if it doesn't already use Tailwind"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already uses Tailwind
    if 'tailwindcss.com' in content:
        print(f"✓ {file_path} already updated")
        return False
    
    # Skip the reference pages (logs, reports, reviews)
    if any(ref in str(file_path) for ref in ['logs/index.html', 'reports/index.html', 'reviews/index.html']):
        print(f"⊗ {file_path} is a reference page, skipping")
        return False
    
    print(f"⚠ {file_path} needs updating (has old styles)")
    return True

# Get all pages that need updating
def find_pages_to_update():
    base_path = Path('/var/www/frontend_leema')
    admin_pages = list((base_path / 'admin').rglob('*/index.html'))
    shop_pages = list((base_path / 'shop').rglob('*/index.html'))
    
    print("\n" + "="*60)
    print("ANALYZING PAGES")
    print("="*60)
    
    admin_to_update = []
    shop_to_update = []
    
    print("\nADMIN PAGES:")
    for page in admin_pages:
        if page.parent.name != 'admin' and update_page_if_needed(page, 'admin'):
            admin_to_update.append(page)
    
    print("\nSHOP PAGES:")
    for page in shop_pages:
        if page.parent.name != 'shop' and update_page_if_needed(page, 'shop'):
            shop_to_update.append(page)
    
    return admin_to_update, shop_to_update

if __name__ == "__main__":
    admin_pages, shop_pages = find_pages_to_update()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nAdmin pages that need updating: {len(admin_pages)}")
    print(f"Shop pages that need updating: {len(shop_pages)}")
    print(f"\nTotal pages to update: {len(admin_pages) + len(shop_pages)}")
    
    if admin_pages:
        print("\nAdmin pages:")
        for page in admin_pages:
            print(f"  - {page.relative_to('/var/www/frontend_leema')}")
    
    if shop_pages:
        print("\nShop pages:")
        for page in shop_pages:
            print(f"  - {page.relative_to('/var/www/frontend_leema')}")
    
    print("\n" + "="*60)
    print("\nNOTE: This script identifies pages that need updating.")
    print("Each page should be manually updated to maintain its functionality")
    print("while applying the new Tailwind CSS design style.")
    print("="*60)
