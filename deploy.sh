#!/bin/bash

# MyWASender Deployment Script
# This script helps you deploy your app to GitHub

echo "🚀 MyWASender Deployment Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo ""
echo "📝 Adding files to Git..."
git add .

# Commit
echo ""
read -p "Enter commit message (default: 'Update MyWASender'): " commit_msg
commit_msg=${commit_msg:-"Update MyWASender"}
git commit -m "$commit_msg"
echo "✅ Files committed"

# Check if remote exists
if ! git remote | grep -q "origin"; then
    echo ""
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo "✅ Remote added"
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Create a new release"
echo "3. Upload your built installers"
echo "4. Share the release link!"
echo ""
echo "🔗 Your repository: $(git remote get-url origin)"
