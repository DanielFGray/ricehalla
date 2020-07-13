import {StarOutlined} from "@ant-design/icons";
import { SharedLayout, Stringify } from "@app/components";
import { useDesktopQuery, usePostCommentMutation,useSharedQuery } from "@app/graphql";
import { Avatar, Button, Comment, Form, Input, List, Skeleton, Space, Tag } from "antd";
import { ApolloError } from "apollo-client";
import { NextPage } from "next";
import Link from "next/link"
import { useRouter } from "next/router"
import { Store } from "rc-field-form/lib/interface";
import React, { useCallback, useState } from "react";

const Desktop: NextPage = () => {
  const [postError, setError] = useState<Error | ApolloError | null>(null);
  const router = useRouter()
  const query = useSharedQuery();
  const [postComment] = usePostCommentMutation()
  const { slug } = router.query
  const { data, error, loading } = useDesktopQuery({
    variables: { desktopId: slug },
  })

  const handleSubmit = useCallback(
    async (values: Store) => {
      console.log(values)
      try {
        await postComment({
          variables: {
            postId: data?.desktop?.id,
            body: values.body,
          },
        })
      } catch (e) {
        setError(e);
      }
    },
    [data?.desktop?.id, postComment],
  )

  if (loading || !data) return <Skeleton />;
  if (error) return Stringify(error.message || error)
  if (! data?.desktop) return Stringify(data);

  const { desktop } = data

  return (
    <SharedLayout
      title=""
      query={query}
    >
      <List itemLayout="vertical" size="large">
        <List.Item
          key={desktop.id}
          actions={[
            <Space key="star"><StarOutlined /></Space>,
          ]}
          extra={
            <a href={desktop.url} key={`${desktop.id}_${desktop.url}`}>
              <img src={desktop.url} style={{ maxHeight: "150px" }}/>
            </a>
          }
        >
          <List.Item.Meta
            title={<Link href="/desktop/[slug]" as={`/desktop/${desktop.id}`}><a>{desktop.title}</a></Link>}
            description={desktop.tags.length > 0 && (
              <>
                <div>
                  by {desktop.user?.username}
                </div>
                {desktop.tags.map(tag => <Tag.CheckableTag checked={false} key={tag}>{tag}</Tag.CheckableTag>)}
              </>
            )}
          />
        </List.Item>
        <List.Item>
          <Form onFinish={handleSubmit} onValuesChange={e => console.log(e)}>
            <Form.Item name="body">
              <Input.TextArea rows={3} placeholder="say something nice" />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" data-cy="postcomment-submit-button">
              Post
              </Button>
            </Form.Item>
          </Form>
        </List.Item>
        {desktop.desktopCommentsByPostId.nodes.map(x => (
          <Comment
            key={x.id}
            actions={[<span key="comment-nested-reply-to">Reply to</span>]}
            author={<a>{x?.user?.username}</a>}
            avatar={
              <Avatar>
                {x?.user?.username[0]}
              </Avatar>
            }
            content={
              <p>
                {x.body}
              </p>
            }
          />
        ))}
      </List>
    </SharedLayout>
  )
};

export default Desktop;
