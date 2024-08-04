import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { json } from "node:stream/consumers";

const ConnectDatabase: React.FC<{ isOpen: boolean, onClose: () => void, onDatabaseConnected: (settings: any) => void }> = ({ isOpen, onClose, onDatabaseConnected }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [settings, setSettings] = useState({
    name: "",
    data_source_configs: [
      {
        type: "postgres",
        connection_args: {
          url: ""
        },
        description: "example description",
      },
    ],
  });

  const parsePostgresUrl = (url: string) => {
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const matches = url.match(regex);
    if (matches) {
      const [_, user, password, host, port, database] = matches;
      return { user, password, host, port, database };
    }
    throw new Error("Invalid PostgreSQL URL");
  };

  const handleConnectDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFlashMessage(null);

    if (!settings.name || !settings.data_source_configs[0].connection_args.url) {
      setFlashMessage({ type: 'error', message: 'Please fill in all required fields.' });
      setIsLoading(false);
      return;
    }

    try {
      const { user, password, host, port, database } = parsePostgresUrl(
        settings.data_source_configs[0].connection_args.url
      );

      const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer 49f39e2230166b597fe6cb498756e425f5f15d82a23bd7b3530a4ec2824351d2", // Replace with your actual API key
      };

      const requestBody = {
        ...settings,
        data_source_configs: [
          {
            ...settings.data_source_configs[0],
            connection_args: { user, password, host, port, database, schema: "public" },
          },
        ],
      };
      //cpm log request body to the json
      console.log(JSON.stringify(requestBody));
      const response = await fetch("https://llm.mdb.ai/minds", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });
      console.log(response);
      if (response.ok) {
        const data = await response.json();
        setFlashMessage({ type: 'success', message: `Success: ${JSON.stringify(data)}` });
        onDatabaseConnected(settings);
        onClose();
      } else {
        const errorData = await response.json();
        setFlashMessage({ type: 'error', message: `Error: ${errorData.detail.title}: ${errorData.detail.detail}` });
      }
    } catch (error) {
      setFlashMessage({ type: 'error', message: `Error: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">Connect D   atabase</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to Database</DialogTitle>
          <DialogDescription>Enter the details to connect to your database. Click connect when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConnectDatabase}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Agent Name
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                PostgreSQL URL
              </Label>
              <Input
                id="url"
                type="text"
                required
                value={settings.data_source_configs[0].connection_args.url}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    data_source_configs: [
                      {
                        ...settings.data_source_configs[0],
                        connection_args: {
                          ...settings.data_source_configs[0].connection_args,
                          url: e.target.value,
                        },
                      },
                    ],
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description (optional)
              </Label>
              <Input
                id="description"
                type="text"
                value={settings.data_source_configs[0].description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    data_source_configs: [
                      {
                        ...settings.data_source_configs[0],
                        description: e.target.value,
                      },
                    ],
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          {flashMessage && (
            <div className={`text-sm ${flashMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {flashMessage.message}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectDatabase;
