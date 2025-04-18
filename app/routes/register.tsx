import { useState } from 'react';
import { json, redirect, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { createUserSession, getUserId } from '~/lib/auth/auth.server';
import { createUser, getUserByUsername } from '~/lib/auth/user.server';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => {
  return [
    { title: "Register | Bolt.diy" },
    { name: "description", content: "Create a new Bolt.diy account" },
  ];
};

export async function loader({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/');
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  const email = formData.get('email') || undefined;
  const redirectTo = formData.get('redirectTo') || '/';

  if (typeof username !== 'string' || typeof password !== 'string' || typeof redirectTo !== 'string') {
    return json(
      { errors: { username: 'Username is required', password: 'Password is required', email: null, form: null } },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return json(
      { errors: { username: 'Username must be at least 3 characters', password: null, email: null, form: null } },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json(
      { errors: { username: null, password: 'Password must be at least 6 characters', email: null, form: null } },
      { status: 400 }
    );
  }

  if (email && typeof email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json(
        { errors: { username: null, password: null, email: 'Invalid email address', form: null } },
        { status: 400 }
      );
    }
  }

  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    return json(
      { errors: { username: 'Username already exists', password: null, email: null, form: null } },
      { status: 400 }
    );
  }

  const user = await createUser(username, password, email as string | undefined);
  if (!user) {
    return json(
      { errors: { username: null, password: null, email: null, form: 'Failed to create user' } },
      { status: 500 }
    );
  }

  return createUserSession(user.id, redirectTo);
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const actionData = useActionData<typeof action>();
  const [formError, setFormError] = useState(actionData?.errors?.form || null);
  const [usernameError, setUsernameError] = useState(actionData?.errors?.username || null);
  const [passwordError, setPasswordError] = useState(actionData?.errors?.password || null);
  const [emailError, setEmailError] = useState(actionData?.errors?.email || null);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 dark:bg-gray-900 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create a new account</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                sign in to your existing account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Form method="post" className="space-y-6" noValidate>
              <input type="hidden" name="redirectTo" value={redirectTo} />
              
              {formError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 text-red-400" aria-hidden="true">⚠️</div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={classNames(
                      "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm",
                      usernameError 
                        ? "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700 dark:text-red-300" 
                        : "border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    )}
                    aria-invalid={usernameError ? true : undefined}
                    aria-describedby={usernameError ? "username-error" : undefined}
                    onChange={() => setUsernameError(null)}
                  />
                </div>
                {usernameError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="username-error">
                    {usernameError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email (optional)
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={classNames(
                      "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm",
                      emailError 
                        ? "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700 dark:text-red-300" 
                        : "border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    )}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? "email-error" : undefined}
                    onChange={() => setEmailError(null)}
                  />
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="email-error">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={classNames(
                      "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm",
                      passwordError 
                        ? "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700 dark:text-red-300" 
                        : "border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    )}
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    onChange={() => setPasswordError(null)}
                  />
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="password-error">
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Create account
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
