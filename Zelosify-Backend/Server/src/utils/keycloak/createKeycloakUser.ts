import axios from "axios";

export async function createKeycloakUser(adminToken: string, userData: any) {
  try {
    console.log("🔹 Creating user in Keycloak...");
    const response = await axios.post(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        credentials: userData.credentials,
        requiredActions: [], // No required actions for now
        emailVerified: true,
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Get the user ID from the location header
    const locationHeader = response.headers.location;
    if (!locationHeader) {
      throw new Error("User created but no location header returned");
    }
    const userId = locationHeader.split("/").pop();
    console.log("✅ User created in Keycloak with ID:", userId);
    return { id: userId };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Do not log the Axios error object: it includes the submitted password
      // and the admin Authorization header in its request configuration.
      console.error("Keycloak user creation failed with status:", error.response?.status ?? "network error");
    } else {
      console.error("Keycloak user creation failed.");
    }
    throw error;
  }
}
