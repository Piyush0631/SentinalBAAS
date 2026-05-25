import { generateApiKey } from "../../utils/generateApiKey.js";

describe("generateApiKey", () => {
  it("should return a string starting with sk_proj_ and 12 random chars", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^sk_proj_[a-zA-Z0-9]{12}$/);
  });

  it("should return a different value each time", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });
});
