import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";

export default function RunsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen name="active" options={{ title: "Active Run" }} />
      <Stack.Screen
        name="complete"
        options={{
          title: "Complete Run",
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="config-timed" options={{ title: "Configure Timed Run" }} />
      <Stack.Screen name="config-distance" options={{ title: "Configure Distance Run" }} />
      <Stack.Screen name="settings" options={{ title: "Run Settings" }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Run Details",
        }}
      />
    </Stack>
  );
}
