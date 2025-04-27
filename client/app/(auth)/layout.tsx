import { ReactNode } from 'react';
import { checkAuthAction } from '../actions/auth.actions';
import { redirect } from 'next/navigation';


export default async function layout({ children }: { children: ReactNode }) {

    const { isAuthenticated } = await checkAuthAction()

    if (isAuthenticated) return redirect("/dashboard")

    return <>{children}</>;
}
