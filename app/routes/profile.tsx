
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useActionData } from '@remix-run/react';
import { getUserId, requireUserId } from '~/lib/auth/auth.server';
import { getUserById, updateUser } from '~/lib/auth/user.server';
import { useState } from 'react';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => {
  return [
    { title: "Profile | Bolt.diy" },
    { name: "description", content: "Manage your Bolt.diy profile" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  
  if (!user) {
    return redirect('/logout');
  }
  
  return json({ 
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    } 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const email = formData.get('email') as string;
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  const updates: Record<string, string> = {};
  const errors: Record<string, string | null> = {
    email: null,
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
    form: null
  };
  
  // Validate email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Invalid email address';
    } else {
      updates.email = email;
    }
  }
  
  // Validate password change if attempted
  if (currentPassword || newPassword ||