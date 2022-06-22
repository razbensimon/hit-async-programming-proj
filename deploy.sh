#!/bin/bash

git pull
systemctl restart backend
systemctl restart frontend
