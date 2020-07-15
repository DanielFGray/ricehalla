import {
  Post,
  PostPlaceholder,
  SharedLayout,
  Stringify,
} from "@app/components";
import { useDesktopListQuery, useSharedQuery } from "@app/graphql";
import { Alert, Button, List } from "antd";
import { NextPage } from "next";
import Link from "next/link";
import * as React from "react";

const Home: NextPage = () => {
  const query = useSharedQuery();
  const { data, error, loading } = useDesktopListQuery();

  return (
    <SharedLayout title="" query={query}>
      {error && (
        <Alert
          type="error"
          message="ope"
          description={Stringify(error.message || error)}
        />
      )}
      <Link href="/newpost">
        <Button type="primary">post new rice</Button>
      </Link>
      <List itemLayout="vertical" size="large">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <PostPlaceholder key={i} />
            ))}
          </>
        ) : (
          data?.desktops?.nodes.map((x) => (
            <Post
              key={x.id}
              {...x}
              commentCount={x.desktopCommentsByPostId.totalCount}
            />
          ))
        )}
      </List>
    </SharedLayout>
  );
};

export default Home;
