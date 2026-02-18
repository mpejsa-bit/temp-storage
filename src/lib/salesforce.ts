import jsforce, { Connection } from "jsforce";

export interface SfAccount {
  Id: string;
  Name: string;
  BillingCity: string | null;
  BillingState: string | null;
  Website: string | null;
  Industry: string | null;
  NumberOfEmployees: number | null;
  Owner: { Name: string } | null;
}

export interface SfContact {
  Id: string;
  Name: string;
  FirstName: string | null;
  LastName: string | null;
  Title: string | null;
  Email: string | null;
  Phone: string | null;
}

export interface SfAccountDetail {
  account: SfAccount;
  contacts: SfContact[];
  instanceUrl: string;
}

const SF_LOGIN_URL = process.env.SF_LOGIN_URL || "https://login.salesforce.com";
const SF_CLIENT_ID = process.env.SF_CLIENT_ID || "";
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET || "";

export function getSfOAuthUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SF_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: "api refresh_token",
  });
  return `${SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, callbackUrl: string) {
  const tokenUrl = `${SF_LOGIN_URL}/services/oauth2/token`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: SF_CLIENT_ID,
      client_secret: SF_CLIENT_SECRET,
      redirect_uri: callbackUrl,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "Token exchange failed");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    instanceUrl: data.instance_url as string,
    refreshToken: data.refresh_token as string | undefined,
  };
}

function getConnectionFromToken(accessToken: string, instanceUrl: string): Connection {
  return new jsforce.Connection({
    instanceUrl,
    accessToken,
  });
}

export function parseSfToken(req: Request): { accessToken: string; instanceUrl: string } | null {
  const accessToken = req.headers.get("x-sf-access-token");
  const instanceUrl = req.headers.get("x-sf-instance-url");
  if (!accessToken || !instanceUrl) return null;
  return { accessToken, instanceUrl };
}

function escapeSoql(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export async function searchAccounts(accessToken: string, instanceUrl: string, query: string): Promise<SfAccount[]> {
  const conn = getConnectionFromToken(accessToken, instanceUrl);
  const escaped = escapeSoql(query);

  const results = await conn.query<SfAccount>(
    `SELECT Id, Name, BillingCity, BillingState, Website, Industry, NumberOfEmployees, Owner.Name
     FROM Account
     WHERE Name LIKE '%${escaped}%'
     ORDER BY Name
     LIMIT 20`
  );

  return results.records;
}

export async function getAccountWithContacts(accessToken: string, instanceUrl: string, accountId: string): Promise<SfAccountDetail> {
  const conn = getConnectionFromToken(accessToken, instanceUrl);

  if (!/^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(accountId)) {
    throw new Error("Invalid Account ID format");
  }

  const accountResult = await conn.query<SfAccount>(
    `SELECT Id, Name, BillingCity, BillingState, Website, Industry, NumberOfEmployees, Owner.Name
     FROM Account
     WHERE Id = '${accountId}'
     LIMIT 1`
  );

  if (!accountResult.records.length) {
    throw new Error("Account not found in Salesforce");
  }

  const contactResult = await conn.query<SfContact>(
    `SELECT Id, Name, FirstName, LastName, Title, Email, Phone
     FROM Contact
     WHERE AccountId = '${accountId}'
     ORDER BY LastName
     LIMIT 50`
  );

  return {
    account: accountResult.records[0],
    contacts: contactResult.records,
    instanceUrl,
  };
}
