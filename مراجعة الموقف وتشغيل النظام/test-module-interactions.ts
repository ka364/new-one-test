import { getModuleInteractions } from "./server/bio-modules/bio-interaction-matrix.js";

console.log("Testing getModuleInteractions...");

const result = getModuleInteractions("arachnid");
console.log("Result:", result);
console.log("Type:", typeof result);
console.log("Is Array:", Array.isArray(result));

if (result) {
  console.log("Result structure:", Object.keys(result));
  console.log("Has outgoing:", "outgoing" in result);
  console.log("Has incoming:", "incoming" in result);
  
  if (Array.isArray(result)) {
    console.log("Length:", result.length);
    console.log("First item:", result[0]);
  }
}
