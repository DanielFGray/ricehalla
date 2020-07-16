import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Post, Redirect, SharedLayout, Stringify } from "@app/components";
import {
  Desktop,
  DesktopComment,
  DesktopDocument,
  useDeleteDesktopCommentMutation,
  useDesktopQuery,
  usePostCommentMutation,
  User,
  useSharedQuery,
} from "@app/graphql";
import {
  extractError,
  getCodeFromError,
  getExceptionFromError,
} from "@app/lib";
import {
  Alert,
  Avatar,
  Button,
  Comment,
  Form,
  Input,
  List,
  Modal,
  Skeleton,
  Space,
} from "antd";
import { ApolloError } from "apollo-client";
import { NextPage } from "next";
import Router, { useRouter } from "next/router";
import { Store } from "rc-field-form/lib/interface";
import React, { useCallback, useEffect, useState } from "react";

const DeletableComment: React.FC<
  Pick<DesktopComment, "id" | "body"> & {
    user?: null | Pick<User, "username" | "avatarUrl">;
    currentUser?: string;
  }
> = ({ id, body, user, currentUser, children }) => {
  const [deleteComment] = useDeleteDesktopCommentMutation({
    variables: { id },
    update: (proxy) => {
      const query = DesktopDocument;
      const data = proxy.readQuery({ query, variables: { desktopId: id } });
      console.log(data);
      /* proxy.writeQuery({ query, data }) */
    },
  });
  return (
    <Comment
      key={id}
      actions={[
        <Space key="comment-nested-reply-to">Reply</Space>,
        <Space key="star">
          <StarOutlined />
        </Space>,
        ...(user?.username === currentUser
          ? [
              <Space key="edit">
                <EditOutlined />
              </Space>,
              <Space key="delete">
                <DeleteOutlined
                  onClick={() => {
                    Modal.confirm({
                      title: "Are you sure you want to delete this comment?",
                      icon: <ExclamationCircleOutlined />,
                      onOk: async () => deleteComment(),
                    });
                  }}
                />
              </Space>,
            ]
          : []),
      ]}
      author={<a>{user?.username}</a>}
      avatar={<Avatar>{user?.avatarUrl || user?.username[0]}</Avatar>}
      content={
        <p>
          {body}
          {children}
        </p>
      }
    />
  );
};

const Rice: NextPage = () => {
  const router = useRouter();
  const query = useSharedQuery();
  const [form] = Form.useForm();
  const [postComment] = usePostCommentMutation();
  const [postError, setError] = useState<Error | ApolloError | null>(null);

  const { slug } = router.query;
  const { data, error, loading } = useDesktopQuery({
    variables: { desktopId: slug as string },
  });

  const handleSubmit = useCallback(
    async (values: Store) => {
      if (!data?.desktop?.id) return null;
      const id = data?.desktop?.id;
      try {
        await postComment({
          variables: {
            postId: id,
            body: values.body,
          },
          update: (proxy) => {
            const cache = proxy.readQuery<Desktop[]>({
              query: DesktopDocument,
              variables: { desktopId: id },
            })!;
            const idx = cache.findIndex((e) => e.id === id);
            console.log(cache, idx);
            /* if (idx < 0) return */
            /* const DesktopList = [ */
            /*   ...cache.DesktopList.slice(0, idx), */
            /*   ...cache.DesktopList.slice(idx + 1), */
            /* ] */
            /* proxy.writeQuery({ */
            /*   query: DesktopDocument, */
            /*   data: { DesktopList }, */
            /* }) */
          },
        });
      } catch (e) {
        const code = getCodeFromError(e);
        const exception = getExceptionFromError(e);
        const fields: any = exception && exception["fields"];

        if (code === "23514") {
          form.setFields([
            {
              name: "title",
              value: form.getFieldValue("title"),
              errors: ["Titles must not be empty"],
            },
          ]);
        } else {
          setError(e);
        }
      }
    },
    [data, form, postComment]
  );

  useEffect(() => {
    if (data?.desktop === null) {
      Router.replace("/");
    }
  }, [data]);

  const comments = React.useMemo(() => {
    const nodes = data?.desktop?.desktopCommentsByPostId?.nodes;

    if (!(nodes && Array.isArray(nodes))) return [];

    const items = new Map<string, typeof nodes[0] & { replies: typeof nodes }>(
      nodes.map(({ id, ...item }) => [id, { ...item, id, replies: [] }])
    );

    for (const [_, item] of items) {
      if (item.parentId) {
        const parent = items.get(item.parentId);
        if (parent) {
          parent.replies.push(item);
        }
      }
    }

    return Array.from(items.values());
  }, [data]);

  const code = getCodeFromError(postError);

  return (
    <SharedLayout title="" query={query}>
      {error && (
        <Alert
          type="error"
          message="ope"
          description={Stringify(error.message || error)}
        />
      )}
      <List itemLayout="vertical" size="large">
        {loading || !data?.desktop ? (
          <List.Item extra={<Skeleton.Image />}>
            <Skeleton active />
            <Skeleton active title={false} />
          </List.Item>
        ) : (
          <Post
            {...data.desktop}
            commentCount={data.desktop.desktopCommentsByPostId.totalCount}
          />
        )}
        <List.Item>
          <Form onFinish={handleSubmit} onValuesChange={(e) => console.log(e)}>
            <Form.Item name="body">
              <Input.TextArea
                disabled={loading || Boolean(error)}
                rows={3}
                placeholder="say something nice"
              />
            </Form.Item>
            {postError ? (
              <Form.Item label="Error">
                <Alert
                  type="error"
                  message="Post failed"
                  description={
                    <span>
                      {extractError(postError).message}
                      {code ? (
                        <span>
                          {" "}
                          (Error code: <code>ERR_{code}</code>)
                        </span>
                      ) : null}
                    </span>
                  }
                />
              </Form.Item>
            ) : null}
            <Form.Item>
              <Button
                disabled={loading || Boolean(error)}
                htmlType="submit"
                data-cy="postcomment-submit-button"
              >
                Post
              </Button>
            </Form.Item>
          </Form>
        </List.Item>
        {loading ? (
          <List.Item>
            <Skeleton active avatar />
          </List.Item>
        ) : (
          comments.map((x) => (
            <DeletableComment
              key={x.id}
              {...x}
              currentUser={query.data?.currentUser?.username}
            />
          ))
        )}
      </List>
    </SharedLayout>
  );
};

export default Rice;
