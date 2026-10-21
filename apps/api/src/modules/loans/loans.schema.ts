import { z } from 'zod';

export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: "Friend's name is required" })
    .trim()
    .min(1, "Friend's name cannot be empty")
    .max(100, "Friend's name is too long"),
  amount: z
    .coerce
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .finite('Amount must be a finite number')
    .refine(
      (val) => {
        const decimals = val.toString().split('.')[1];
        return !decimals || decimals.length <= 2;
      },
      { message: 'Amount cannot have more than 2 decimal places' }
    ),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must follow YYYY-MM-DD format'),
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid('Loan ID must be a valid UUID'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
