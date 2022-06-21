#!/bin/bash

git pull
sudo systemctl restart backend
sudo systemctl restart frontend
