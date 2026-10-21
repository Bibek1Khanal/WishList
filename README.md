# Wishlist

Shared wishlist using a plain-text JSON database at data/wishlist.txt. Node.js serves the pages and writes to the file.

## Run locally

Use Node.js 18 or newer. PowerShell:

    $env:ADMIN_PASSWORD = "choose-a-long-private-password"
    node server.js

Open http://localhost:3000 (manager: /admin.html). Item changes require ADMIN_PASSWORD. Visitors can add named contribution amounts. Names and amounts are public. Contributions cannot exceed an item's price.

## Hosting

GitHub Pages cannot run this server or write wishlist.txt. Deploy this folder to Node.js hosting with persistent disk, configure ADMIN_PASSWORD, and retain data/ across restarts. Pages poll every 20 seconds for shared updates.

Items previously saved in browser localStorage do not migrate automatically; copy them into data/wishlist.txt before switching.
