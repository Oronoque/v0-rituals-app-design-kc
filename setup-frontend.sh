#!/bin/bash
# Frontend Setup Script for Rituals App

echo "🎯 Setting up frontend environment..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
    echo "✅ Created .env.local with API configuration"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🚀 Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running: cd backend && bun run dev"
echo "2. Start frontend: bun run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Test credentials:"
echo "Email: test@example.com"
echo "Password: TestPassword123" 