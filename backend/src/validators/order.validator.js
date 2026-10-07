const { z } = require("zod");

const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().trim().min(5, "Address is required"),
  city: z.string().trim().min(2, "City is required"),
  paymentMethod: z.enum(["PAYHERE", "WHATSAPP"], {
    errorMap: () => ({ message: "Payment method must be PAYHERE or WHATSAPP" }),
  }),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid("Invalid variant ID"),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      }),
    )
    .min(1, "Cart cannot be empty"),
});

module.exports = {
  createOrderSchema,
};
