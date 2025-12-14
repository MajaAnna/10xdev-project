#!/bin/bash

# Test Suite for GET /api/flashcards endpoint
# This file contains manual curl tests for the list flashcards endpoint
# 
# Usage:
#   chmod +x .ai/test-get-flashcards.sh
#   ./.ai/test-get-flashcards.sh
#
# Or run individual tests by copying the curl commands

BASE_URL="http://localhost:4321"
ENDPOINT="$BASE_URL/api/flashcards"

echo "=========================================="
echo "GET /api/flashcards - Test Suite"
echo "=========================================="
echo ""

# Test 1: Default parameters (page=1, limit=20)
echo "Test 1: Default parameters (no query params)"
echo "Expected: Returns first 20 flashcards, page 1"
echo "Command: curl -s '$ENDPOINT'"
echo "---"
curl -s "$ENDPOINT" | jq .
echo ""
echo ""

# Test 2: Custom limit
echo "Test 2: Custom limit (limit=2)"
echo "Expected: Returns first 2 flashcards, shows total_pages based on limit"
echo "Command: curl -s '$ENDPOINT?limit=2'"
echo "---"
curl -s "$ENDPOINT?limit=2" | jq .
echo ""
echo ""

# Test 3: Second page with custom limit
echo "Test 3: Second page with custom limit (page=2, limit=2)"
echo "Expected: Returns items 3-4 (or fewer if less data available)"
echo "Command: curl -s '$ENDPOINT?page=2&limit=2'"
echo "---"
curl -s "$ENDPOINT?page=2&limit=2" | jq .
echo ""
echo ""

# Test 4: Large limit
echo "Test 4: Large limit (limit=50)"
echo "Expected: Returns all available flashcards (up to 50)"
echo "Command: curl -s '$ENDPOINT?limit=50'"
echo "---"
curl -s "$ENDPOINT?limit=50" | jq .
echo ""
echo ""

# Test 5: Page beyond available data
echo "Test 5: Page beyond available data (page=100)"
echo "Expected: Returns empty array with total_items=0 (not an error)"
echo "Command: curl -s '$ENDPOINT?page=100'"
echo "---"
curl -s "$ENDPOINT?page=100" | jq .
echo ""
echo ""

# Test 6: Invalid page (page=0)
echo "Test 6: Invalid page number (page=0)"
echo "Expected: 400 Bad Request with validation error"
echo "Command: curl -s '$ENDPOINT?page=0'"
echo "---"
curl -s "$ENDPOINT?page=0" | jq .
echo ""
echo ""

# Test 7: Invalid page (negative)
echo "Test 7: Invalid page number (page=-1)"
echo "Expected: 400 Bad Request with validation error"
echo "Command: curl -s '$ENDPOINT?page=-1'"
echo "---"
curl -s "$ENDPOINT?page=-1" | jq .
echo ""
echo ""

# Test 8: Invalid limit (too large)
echo "Test 8: Invalid limit (limit=200, max is 100)"
echo "Expected: 400 Bad Request with validation error"
echo "Command: curl -s '$ENDPOINT?limit=200'"
echo "---"
curl -s "$ENDPOINT?limit=200" | jq .
echo ""
echo ""

# Test 9: Invalid limit (zero)
echo "Test 9: Invalid limit (limit=0)"
echo "Expected: 400 Bad Request with validation error"
echo "Command: curl -s '$ENDPOINT?limit=0'"
echo "---"
curl -s "$ENDPOINT?limit=0" | jq .
echo ""
echo ""

# Test 10: Invalid parameter type
echo "Test 10: Invalid parameter type (page=abc)"
echo "Expected: 400 Bad Request with validation error"
echo "Command: curl -s '$ENDPOINT?page=abc'"
echo "---"
curl -s "$ENDPOINT?page=abc" | jq .
echo ""
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="

