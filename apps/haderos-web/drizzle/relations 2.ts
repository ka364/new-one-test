import { relations } from "drizzle-orm/relations";
import { users, accountGenerationLogs, aiSuggestions, dynamicIcons, monthlyEmployeeAccounts, employeeMonthlyData, products, factoryBatches, founderAccounts, founderLoginHistory, googleDriveFiles, productImages, imageEmbeddings, inventory, orders, orderItems, orderStatusHistory, productBarcodes, productSizeCharts, replacements, shipments, returns, shopifyOrders, shopifyProducts, stockAlerts, taskPatterns, userBehavior, userPreferences, visualSearchHistory } from "./schema";

export const accountGenerationLogsRelations = relations(accountGenerationLogs, ({one}) => ({
	user: one(users, {
		fields: [accountGenerationLogs.generatedBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accountGenerationLogs: many(accountGenerationLogs),
	aiSuggestions: many(aiSuggestions),
	dynamicIcons: many(dynamicIcons),
	googleDriveFiles_userId: many(googleDriveFiles, {
		relationName: "googleDriveFiles_userId_users_id"
	}),
	googleDriveFiles_createdBy: many(googleDriveFiles, {
		relationName: "googleDriveFiles_createdBy_users_id"
	}),
	taskPatterns: many(taskPatterns),
	userBehaviors: many(userBehavior),
	userPreferences: many(userPreferences),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({one}) => ({
	user: one(users, {
		fields: [aiSuggestions.userId],
		references: [users.id]
	}),
}));

export const dynamicIconsRelations = relations(dynamicIcons, ({one}) => ({
	user: one(users, {
		fields: [dynamicIcons.userId],
		references: [users.id]
	}),
}));

export const employeeMonthlyDataRelations = relations(employeeMonthlyData, ({one}) => ({
	monthlyEmployeeAccount: one(monthlyEmployeeAccounts, {
		fields: [employeeMonthlyData.accountId],
		references: [monthlyEmployeeAccounts.id]
	}),
}));

export const monthlyEmployeeAccountsRelations = relations(monthlyEmployeeAccounts, ({many}) => ({
	employeeMonthlyData: many(employeeMonthlyData),
}));

export const factoryBatchesRelations = relations(factoryBatches, ({one}) => ({
	product: one(products, {
		fields: [factoryBatches.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	factoryBatches: many(factoryBatches),
	inventories: many(inventory),
	orderItems: many(orderItems),
	productBarcodes: many(productBarcodes),
	productImages: many(productImages),
	productSizeCharts: many(productSizeCharts),
	shopifyProducts: many(shopifyProducts),
	visualSearchHistories_topResultProductId: many(visualSearchHistory, {
		relationName: "visualSearchHistory_topResultProductId_products_id"
	}),
	visualSearchHistories_selectedProductId: many(visualSearchHistory, {
		relationName: "visualSearchHistory_selectedProductId_products_id"
	}),
}));

export const founderLoginHistoryRelations = relations(founderLoginHistory, ({one}) => ({
	founderAccount: one(founderAccounts, {
		fields: [founderLoginHistory.founderId],
		references: [founderAccounts.id]
	}),
}));

export const founderAccountsRelations = relations(founderAccounts, ({many}) => ({
	founderLoginHistories: many(founderLoginHistory),
}));

export const googleDriveFilesRelations = relations(googleDriveFiles, ({one}) => ({
	user_userId: one(users, {
		fields: [googleDriveFiles.userId],
		references: [users.id],
		relationName: "googleDriveFiles_userId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [googleDriveFiles.createdBy],
		references: [users.id],
		relationName: "googleDriveFiles_createdBy_users_id"
	}),
}));

export const imageEmbeddingsRelations = relations(imageEmbeddings, ({one}) => ({
	productImage: one(productImages, {
		fields: [imageEmbeddings.imageId],
		references: [productImages.id]
	}),
}));

export const productImagesRelations = relations(productImages, ({one, many}) => ({
	imageEmbeddings: many(imageEmbeddings),
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one, many}) => ({
	product: one(products, {
		fields: [inventory.productId],
		references: [products.id]
	}),
	stockAlerts: many(stockAlerts),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const ordersRelations = relations(orders, ({many}) => ({
	orderItems: many(orderItems),
	orderStatusHistories: many(orderStatusHistory),
	replacements_originalOrderId: many(replacements, {
		relationName: "replacements_originalOrderId_orders_id"
	}),
	replacements_newOrderId: many(replacements, {
		relationName: "replacements_newOrderId_orders_id"
	}),
	returns: many(returns),
	shipments: many(shipments),
	shopifyOrders: many(shopifyOrders),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({one}) => ({
	order: one(orders, {
		fields: [orderStatusHistory.orderId],
		references: [orders.id]
	}),
}));

export const productBarcodesRelations = relations(productBarcodes, ({one}) => ({
	product: one(products, {
		fields: [productBarcodes.productId],
		references: [products.id]
	}),
}));

export const productSizeChartsRelations = relations(productSizeCharts, ({one}) => ({
	product: one(products, {
		fields: [productSizeCharts.productId],
		references: [products.id]
	}),
}));

export const replacementsRelations = relations(replacements, ({one}) => ({
	order_originalOrderId: one(orders, {
		fields: [replacements.originalOrderId],
		references: [orders.id],
		relationName: "replacements_originalOrderId_orders_id"
	}),
	order_newOrderId: one(orders, {
		fields: [replacements.newOrderId],
		references: [orders.id],
		relationName: "replacements_newOrderId_orders_id"
	}),
}));

export const returnsRelations = relations(returns, ({one}) => ({
	shipment: one(shipments, {
		fields: [returns.shipmentId],
		references: [shipments.id]
	}),
	order: one(orders, {
		fields: [returns.orderId],
		references: [orders.id]
	}),
}));

export const shipmentsRelations = relations(shipments, ({one, many}) => ({
	returns: many(returns),
	order: one(orders, {
		fields: [shipments.orderId],
		references: [orders.id]
	}),
}));

export const shopifyOrdersRelations = relations(shopifyOrders, ({one}) => ({
	order: one(orders, {
		fields: [shopifyOrders.localOrderId],
		references: [orders.id]
	}),
}));

export const shopifyProductsRelations = relations(shopifyProducts, ({one}) => ({
	product: one(products, {
		fields: [shopifyProducts.localProductId],
		references: [products.id]
	}),
}));

export const stockAlertsRelations = relations(stockAlerts, ({one}) => ({
	inventory: one(inventory, {
		fields: [stockAlerts.inventoryId],
		references: [inventory.id]
	}),
}));

export const taskPatternsRelations = relations(taskPatterns, ({one}) => ({
	user: one(users, {
		fields: [taskPatterns.userId],
		references: [users.id]
	}),
}));

export const userBehaviorRelations = relations(userBehavior, ({one}) => ({
	user: one(users, {
		fields: [userBehavior.userId],
		references: [users.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const visualSearchHistoryRelations = relations(visualSearchHistory, ({one}) => ({
	product_topResultProductId: one(products, {
		fields: [visualSearchHistory.topResultProductId],
		references: [products.id],
		relationName: "visualSearchHistory_topResultProductId_products_id"
	}),
	product_selectedProductId: one(products, {
		fields: [visualSearchHistory.selectedProductId],
		references: [products.id],
		relationName: "visualSearchHistory_selectedProductId_products_id"
	}),
}));