"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardStore } from "@/modules/dashboard/store/dashboard.store";
import { TaxFirmList } from "./TaxFirmList";

export const Dashboard = () => {
  const { stats } = useDashboardStore();
  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      {/* Welcome Header */}
      <Card
        className=" border-0 rounded-lg text-white"
        style={{
          background: "linear-gradient(to bottom right, #33538f, #1e293b)",
        }}
      >
        <CardHeader>
          <CardTitle className="text-3xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-blue-100 text-base">
            Here&apos;s what&apos;s happening with your practice today
          </CardDescription>
        </CardHeader>
      </Card>
      {/* <Card className="container border-0 rounded-lg text-white p-3 grid grid-cols-2  lg:grid-cols-4 gap-3">
                <Link href="/crm/addTaxFirm" className="col-span-1">
                  <Button className="w-full">Add Tax Firm</Button>
                </Link>
                <Link href="/crm/addContact" className="col-span-1">
                  <Button className="w-full">Add a contact</Button>
                </Link>
                <Link href="/comingsoon" className="col-span-1">
                  <Button className="w-full">Log an Activity</Button>
                </Link>
                <Link href="/comingsoon" className="col-span-1">
                  <Button className="w-full">View Tax Firms</Button>
                </Link>
              </Card> */}
      {/* Stats Grid */}
      <div className="grid  md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          return (
            <Card key={index} className="rounded-lg">
              <CardContent>
                <CardDescription>{stat.title}</CardDescription>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stat.value}
                </p>
                <Badge
                  variant="secondary"
                  className="bg-green-100 mt-1 text-success hover:bg-green-100"
                >
                  {stat.trend}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <TaxFirmList from="dashboard" />
    </div>
  );
};
