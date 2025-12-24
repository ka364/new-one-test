# REST Admin API reference

**URL:** https://shopify.dev/docs/api/admin-rest

---

Skip to main content
Apps
Storefronts
Agents
References
Ask assistant
/
Help
•
Log in

Shopify uses cookies to provide necessary site functionality and improve your experience. By using our website, you agree to our privacy policy and our cookie policy.

OK
Expand sidebar

The REST Admin API is a legacy API as of October 1, 2024. Starting April 1, 2025, all new public apps must be built exclusively with the GraphQL Admin API. For details and migration steps, visit our migration guide.

REST Admin API reference

The Admin API lets you build apps and integrations that extend and enhance the Shopify admin.

Some newer platform features may only be available in GraphQL.

Copy page MD
Anchor to Client libraries
Client libraries

Use Shopify’s officially supported libraries to build fast, reliable apps with the programming languages and frameworks you already know.

cURL

Use the curl 
utility
 to make API queries directly from the command line.

Remix
Node.js
Ruby
Other
cURL
Remix
Node.js
Ruby
Copy
1
2
3
# cURL is often available by default on macOS and Linux.
#
# See http://curl.se/docs/install.html for more details.
Anchor to Authentication
Authentication

All REST Admin API queries require a valid Shopify access token.

Public and custom apps created in the Dev Dashboard generate tokens using OAuth, and custom apps made in the Shopify admin are authenticated in the Shopify admin. To simplify the authentication process, use one of the recommended Shopify client libraries.

Include your token as a X-Shopify-Access-Token header on all API queries. Using Shopify’s supported client libraries can simplify this process.

To keep the platform secure, apps need to request specific access scopes during the install process. Only request as much data access as your app needs to work.

Learn more about getting started with authentication and building apps.

cURL
Remix
Node.js
Ruby
Copy
1
2
3
curl -X GET \ https://{shop}.myshopify.com/admin/api/2025-10/shop.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {password}'
Anchor to Endpoints and requests
Endpoints and requests

Admin REST API endpoints are organized by resource type. You’ll need to use different endpoints depending on your app’s requirements.

All Admin REST API endpoints follow this pattern:

https://{store_name}.myshopify.com/admin/api/2025-10/{resource}.json

POST
Example POST request

Create a new product.

This example illustrates how to create a new product using the Product resource and the /admin/api/2025-10/products.json endpoint. Replace {store_name} with your store’s domain and {access_token} with the access token you generated in the Authentication section.

GET
Example GET request
PUT
Example PUT request
DEL
Example DELETE request
POST
/admin/api/2025-10/products.json
cURL
Node.js
Ruby
Copy
1
2
3
4
5
6
7
8
9
10
11
12
# Create a new product record
curl -X POST \
  https://{store_name}.myshopify.com/admin/api/2025-10/products.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {access_token}' \
  -d '
  {
    "product": {
      "title": "Hiking backpack"
    }
  }
  '
{} Response
Copy
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
HTTP/1.1 200 OK
{
  "product": {
    "id": 11235813213455,
    "title": "Hiking backpack",
    "body_html": null,
    "vendor": "",
    "product_type": "",
    "created_at": "<NOW>",
    "handle": "hiking-backpack",
    "updated_at": "<NOW>",
    "published_at": "<NOW>",
    "template_suffix": null,
    "status": "active",
    "published_scope": "web",
    "tags": "",
    "admin_graphql_api_id": "gid://shopify/Product/11235813213455",
    "variants": [
      {
        "id": 16180339887498,
        "product_id": 11235813213455,
        "title": "Default Title",
        "price": "0.00",
        "sku": "",
        "position": 1,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Default Title",
        "option2": null,
        "option3": null,
        "created_at": "<NOW>",
        "updated_at": "<NOW>",
        "taxable": true,
        "barcode": null,

The Admin API is versioned, with new releases four times per year. To keep your app stable, make sure you specify a supported version in the URL. Learn more about API versioning.

All REST endpoints support cursor-based pagination. All requests produce HTTP response status codes.

Learn more about API usage.

Anchor to Rate limits
Rate limits

The REST Admin API supports a limit of 40 requests per app per store per minute. This allotment replenishes at a rate of 2 requests per second. The rate limit is increased by a factor of 10 for Shopify Plus stores.

Anchor to Usage limitations
Usage limitations

REST Admin API supports a limit of 40 requests per app per store per minute.

Past the limit, the API will return a 429 Too Many Requests error.

All REST API responses include the X-Shopify-Shop-Api-Call-Limit header, which shows how many requests the client has made, and the total number allowed per minute.

A 429 response will also include a Retry-After header with the number of seconds to wait until retrying your query.

Learn more about rate limits.

{} Header
Copy
1
2
X-Shopify-Shop-Api-Call-Limit: 40/40
Retry-After: 2.0
{} Response
Copy
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
HTTP/1.1 429 Too Many Requests
{
  "customers": [
    {
      "id": 207119551,
      "email": "bob.norman@hostmail.com",
      "accepts_marketing": false,
      "created_at": "2021-02-12T13:48:32-05:00",
      "updated_at": "2021-02-12T13:48:32-05:00",
      "first_name": "Bob",
      "last_name": "Norman",
      "orders_count": 1,
      "state": "disabled",
      "total_spent": "199.65",
      "last_order_id": 450789469,
      "note": null,
      "verified_email": true,
      "multipass_identifier": null,
      "tax_exempt": false,
      "phone": "+16136120707",
      "tags": "",
      "last_order_name": "#1001",
      "currency": "USD",
      "addresses": [
        {
          "id": 207119551,
          "customer_id": 207119551,
          "first_name": null,
          "last_name": null,
          "company": null,
          "address1": "Chestnut Street 92",
          "address2": "",
          "city": "Louisville",
          "province": "Kentucky",
          "country": "United States",
          "zip": "40202",
Anchor to Status and error codes
Status and error codes

All API queries return HTTP status codes that can tell you more about the response.

Anchor to [object Object]
401 Unauthorized

The client doesn’t have correct authentication credentials.

Anchor to [object Object]
402 Payment Required

The shop is frozen. The shop owner will need to pay the outstanding balance to 
unfreeze
 the shop.

Anchor to [object Object]
403 Forbidden

The server is refusing to respond. This is typically caused by incorrect access scopes.

Anchor to [object Object]
404 Not Found

The requested resource was not found but could be available again in the future.

Anchor to [object Object]
422 Unprocessable Entity

The request body contains semantic errors. This is typically caused by incorrect formatting, omitting required fields, or logical errors such as initiating a checkout for an out-of-stock product.

Anchor to [object Object]
429 Too Many Requests

The client has exceeded the rate limit.

Anchor to [object Object]
5xx Errors

An internal error occurred in Shopify. Check out the Shopify status 
page
 for more information.

Didn’t find the status code you’re looking for?

View the complete list of API status response and error codes.

{} Sample error codes
401
402
403
404
422
429
500
Copy
1
2
3
4
HTTP/1.1 401 Unauthorized
{
  "errors": "[API] Invalid API key or access token (unrecognized login or wrong password)"
}
Was this page helpful?
Yes
No
Updates
Developer changelog
Shopify Editions
Business growth
Shopify Partners Program
Shopify App Store
Shopify Academy
Legal
Terms of service
API terms of use
Privacy policy
Partners Program Agreement
Shopify
About Shopify
Shopify Plus
Careers
Investors
Press and media
Assistant