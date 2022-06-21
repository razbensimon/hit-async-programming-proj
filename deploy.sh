#!/bin/bash

git pull
cd frontend
npm install
npm run build
cp -r build/* /var/www/html/
systemctl restart lighttpd
systemctl restart backend
