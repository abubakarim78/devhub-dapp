#!/bin/bash
# Test script to check if card data exists after upgrade

PACKAGE_ID="0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2"
DEVHUB_ID="0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40"

echo "Testing card count with new package..."
echo "Package ID: $PACKAGE_ID"
echo "DevHub ID: $DEVHUB_ID"
echo ""

sui client call \
  --package "$PACKAGE_ID" \
  --module devhub \
  --function get_card_count \
  --args "$DEVHUB_ID" \
  --gas-budget 10000000
