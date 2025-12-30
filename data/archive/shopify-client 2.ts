    const mutation = `
      mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
          inventoryLevel {
            id
            available
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      inventoryLevelId: `gid://shopify/InventoryLevel/${inventoryItemId}?inventory_item_id=${inventoryItemId}`,
      availableDelta: quantity,
    };

    const result = await this.query(mutation, { input });
    
    if (result.data?.inventoryAdjustQuantity?.userErrors?.length > 0) {
      throw new Error(
        `Inventory update failed: ${result.data.inventoryAdjustQuantity.userErrors[0].message}`
      );
    }

    return result.data?.inventoryAdjustQuantity?.inventoryLevel;
  }

  /**
   * Get orders (paginated)