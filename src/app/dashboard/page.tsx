"use client";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CreateCenterDialog } from "@/components/create-center-dialog";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { EditCenterDialog } from "@/components/edit-center-dialog";
import { DeleteCenterDialog } from "@/components/delete-center-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import { Pagination } from "@/components/pagination";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [centerSearch, setCenterSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search values
  const [debouncedCenterSearch, setDebouncedCenterSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");

  // Debounce center search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCenterSearch(centerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [centerSearch]);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const { data: centers, isLoading: centersLoading } = trpc.ecmoCenter.getAll.useQuery({
    search: debouncedCenterSearch,
  });

  const { data: usersData, isLoading: usersLoading } = trpc.user.getAll.useQuery({
    search: debouncedUserSearch,
    page: currentPage,
    limit: 10,
  });

  const users = usersData?.users;
  const totalPages = usersData?.totalPages || 1;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedUserSearch]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">ECMO Center Management</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Welcome, {session.user?.name || session.user?.email}
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>ECMO Centers</CardTitle>
              <CardDescription>
                Manage ECMO centers and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, city, or state..."
                  value={centerSearch}
                  onChange={(e) => setCenterSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {centersLoading ? (
                <p>Loading centers...</p>
              ) : centers && centers.length > 0 ? (
                <div className="space-y-4">
                  {centers.map((center) => (
                    <div
                      key={center.id}
                      className="rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{center.name}</h3>
                          <p className="text-sm text-gray-600">
                            {center.type} - {center.city}, {center.state}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {center.users.length} staff members
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <EditCenterDialog center={center} />
                          <DeleteCenterDialog
                            centerId={center.id}
                            centerName={center.name}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <CreateCenterDialog />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {debouncedCenterSearch ? "No centers match your search" : "No centers found"}
                  </p>
                  {!debouncedCenterSearch && (
                    <CreateCenterDialog buttonText="Create First Center" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and roles
                {usersData && (
                  <span className="ml-2 text-xs">
                    ({usersData.total} total)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {usersLoading ? (
                <p>Loading users...</p>
              ) : users && users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Role: {user.role}
                          </p>
                          {user.center && (
                            <p className="text-xs text-gray-500">
                              Center: {user.center.name}
                            </p>
                          )}
                          {user.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {user.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <EditUserDialog user={user} />
                          <DeleteUserDialog
                            userId={user.id}
                            userName={user.name}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <CreateUserDialog />
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {debouncedUserSearch ? "No users match your search" : "No users found"}
                  </p>
                  {!debouncedUserSearch && (
                    <CreateUserDialog buttonText="Create First User" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
