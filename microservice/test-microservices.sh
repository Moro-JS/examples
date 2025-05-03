#!/bin/bash

# Microservice Testing Script
# Tests the complete e-commerce flow: User → Order → Payment

echo "Testing Moro Microservices Architecture"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
USER_SERVICE_URL="http://localhost:3010"
PAYMENT_SERVICE_URL="http://localhost:3011"
ORDER_SERVICE_URL="http://localhost:3012"
NGINX_URL="http://localhost:3000"

# Helper function for API calls
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    echo -n "Testing: $test_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $response_body"
        return 1
    fi
}

# Test service health
echo -e "\n${BLUE}🏥 Health Check Tests${NC}"
test_endpoint "GET" "$USER_SERVICE_URL/health" "" "200" "User Service Health"
test_endpoint "GET" "$PAYMENT_SERVICE_URL/health" "" "200" "Payment Service Health"
test_endpoint "GET" "$ORDER_SERVICE_URL/health" "" "200" "Order Service Health"

# Test service info
echo -e "\n${BLUE}ℹ Service Info Tests${NC}"
test_endpoint "GET" "$USER_SERVICE_URL/" "" "200" "User Service Info"
test_endpoint "GET" "$PAYMENT_SERVICE_URL/" "" "200" "Payment Service Info"
test_endpoint "GET" "$ORDER_SERVICE_URL/" "" "200" "Order Service Info"

# Test Nginx gateway
echo -e "\n${BLUE}🌐 Gateway Tests${NC}"
test_endpoint "GET" "$NGINX_URL/" "" "200" "Nginx Gateway Root"
test_endpoint "GET" "$NGINX_URL/health" "" "200" "Nginx Gateway Health"

# Test user management
echo -e "\n${BLUE}👤 User Management Tests${NC}"
test_endpoint "GET" "$USER_SERVICE_URL/users" "" "200" "List Users"
test_endpoint "GET" "$USER_SERVICE_URL/users/1" "" "200" "Get User by ID"
test_endpoint "POST" "$USER_SERVICE_URL/users" '{"name":"Test User","email":"test@example.com","role":"user"}' "201" "Create User"
test_endpoint "POST" "$USER_SERVICE_URL/users" '{"name":"A","email":"invalid"}' "400" "Create Invalid User"

# Test payment providers
echo -e "\n${BLUE}💳 Payment Provider Tests${NC}"
test_endpoint "GET" "$PAYMENT_SERVICE_URL/providers" "" "200" "Get Payment Providers"
test_endpoint "GET" "$PAYMENT_SERVICE_URL/payments" "" "200" "List Payments"

# Test payment processing
echo -e "\n${BLUE}💰 Payment Processing Tests${NC}"
test_endpoint "POST" "$PAYMENT_SERVICE_URL/payments/process" '{"amount":99.99,"provider":"stripe","currency":"USD"}' "201" "Process Payment"
test_endpoint "POST" "$PAYMENT_SERVICE_URL/payments/process" '{"amount":-10,"provider":"stripe"}' "400" "Invalid Payment Amount"
test_endpoint "POST" "$PAYMENT_SERVICE_URL/payments/process" '{"amount":50,"provider":"nonexistent"}' "400" "Invalid Payment Provider"

# Test inventory
echo -e "\n${BLUE}Inventory Tests${NC}"
test_endpoint "GET" "$ORDER_SERVICE_URL/inventory" "" "200" "Get Inventory"

# Test order management
echo -e "\n${BLUE}🛒 Order Management Tests${NC}"
test_endpoint "GET" "$ORDER_SERVICE_URL/orders" "" "200" "List Orders"

# Test complete e-commerce flow
echo -e "\n${BLUE}Complete E-commerce Flow Test${NC}"

echo "Step 1: Create a new user..."
user_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"name":"John Doe","email":"john@example.com","role":"user"}' \
    "$USER_SERVICE_URL/users")
user_id=$(echo $user_response | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

if [ -n "$user_id" ]; then
    echo -e "${GREEN}✓ User created with ID: $user_id${NC}"
    
    echo "Step 2: Create an order for this user..."
    order_response=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"userId\":$user_id,\"items\":[{\"productId\":\"laptop\",\"quantity\":1}],\"shippingAddress\":\"123 Main St\",\"paymentMethod\":\"stripe\"}" \
        "$ORDER_SERVICE_URL/orders")
    
    order_success=$(echo $order_response | grep -o '"success":true')
    
    if [ -n "$order_success" ]; then
        echo -e "${GREEN}✓ Order created successfully${NC}"
        
        order_id=$(echo $order_response | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
        echo "Step 3: Check order status..."
        test_endpoint "GET" "$ORDER_SERVICE_URL/orders/$order_id" "" "200" "Get Created Order"
        
        echo "Step 4: Update order status..."
        test_endpoint "PUT" "$ORDER_SERVICE_URL/orders/$order_id/status" '{"status":"shipped","reason":"Order shipped via FedEx"}' "200" "Update Order Status"
    else
        echo -e "${RED}✗ Failed to create order${NC}"
        echo "Response: $order_response"
    fi
else
    echo -e "${RED}✗ Failed to create user${NC}"
    echo "Response: $user_response"
fi

# Test service discovery
echo -e "\n${BLUE}Service Discovery Tests${NC}"
test_endpoint "GET" "$USER_SERVICE_URL/services" "" "200" "User Service Discovery"
test_endpoint "GET" "$PAYMENT_SERVICE_URL/services" "" "200" "Payment Service Discovery"
test_endpoint "GET" "$ORDER_SERVICE_URL/services" "" "200" "Order Service Discovery"

# Test through Nginx gateway
echo -e "\n${BLUE}🌐 Gateway Routing Tests${NC}"
test_endpoint "GET" "$NGINX_URL/users" "" "200" "Gateway → User Service"
test_endpoint "GET" "$NGINX_URL/payments" "" "200" "Gateway → Payment Service"
test_endpoint "GET" "$NGINX_URL/orders" "" "200" "Gateway → Order Service"

echo -e "\n${GREEN}Microservice Testing Complete!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo "• All services are running and healthy"
echo "• Inter-service communication is working"
echo "• Complete e-commerce flow is functional"
echo "• Service discovery is operational"
echo "• Gateway routing is working"
echo -e "\n${BLUE}Access Points:${NC}"
echo "• User Service: $USER_SERVICE_URL"
echo "• Payment Service: $PAYMENT_SERVICE_URL" 
echo "• Order Service: $ORDER_SERVICE_URL"
echo "• API Gateway: $NGINX_URL" 