import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function App() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Site Safety Inspection Tracker</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge>open</Badge>
          <Badge variant="destructive">critical</Badge>
          <Button>It works</Button>
        </CardContent>
      </Card>
    </main>
  );
}