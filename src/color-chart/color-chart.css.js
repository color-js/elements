import global from "./color-chart-global.css" with { type: "css" };
import shadow from "./color-chart-shadow.css" with { type: "css" };

export { global, shadow };
export default global + "\n\n" + shadow;
