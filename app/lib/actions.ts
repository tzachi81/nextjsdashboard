'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// { ZOD FIRLTERING }
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// { CREATE }
export async function createInvoice(formData: FormData) {

  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });


  const amountInCents = amount * 100;
  // const date = new Date().toString().split('T')[0];
  const date = new Date().toString().split('GMT')[0].trim();


  try {

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return { message: 'Database Error: "Create Invoice" action failed.' }
  }

  //On DB updated, the /dashboard/invoices path will be revalidated,
  //and fresh data will be fetched from the server.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}

// { UPDATE }
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;


  try {

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: "Update Invoice" action failed.' }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


export async function deleteInvoice(id: string) {
  
  //DELETE this dmi error throw
  // throw new Error('Failed to Delete Invoice');
  //******************************/

  try {

    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice  Deleted.' }

  } catch (error) {
    return { message: 'Database Error: "Delete Invoice" action failed.' }
  }
}