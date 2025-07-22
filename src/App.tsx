import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { RoleBasedDashboard } from "./components/RoleBasedDashboard";

function App() {
  return (
  <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <RoleBasedDashboard />
      </Authenticated>
    </main>
  );
}

export default App;
