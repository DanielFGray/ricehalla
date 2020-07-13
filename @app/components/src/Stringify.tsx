import React from "react";

export const Stringify = (data: any): JSX.Element => (
  <pre>
    {JSON.stringify(data, null, 2)}
  </pre>
)
