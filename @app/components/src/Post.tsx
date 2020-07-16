import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  Desktop,
  StarOnPostsConnection,
  useCreateStarOnPostMutation,
  useDeleteDesktopMutation,
  User,
  useSharedQuery,
} from "@app/graphql";
import { List, Modal, Skeleton, Space, Tag } from "antd";
import Link from "next/link";
import React from "react";

export const PostPlaceholder: React.FC = () => (
  <List.Item extra={<Skeleton.Image />}>
    <Skeleton active />
  </List.Item>
);

export const Post: React.FC<
  Pick<Desktop, "id" | "url" | "title" | "tags"> & {
    user?: null | Pick<User, "username">; // FIXME why isn't this in the Pick above?
    starOnPostsByPostId: Pick<StarOnPostsConnection, "totalCount">; // FIXME why isn't this in the Pick above?
    commentCount: number;
  }
> = ({ id, url, title, tags, user, commentCount, starOnPostsByPostId }) => {
  const [deleteDesktop] = useDeleteDesktopMutation();
  const [starDesktop] = useCreateStarOnPostMutation();
  const sharedQuery = useSharedQuery();
  const actions = [
    <Space key="star">
      <StarOutlined
        onClick={() => {
          starDesktop({ variables: { id } });
        }}
      />
      {starOnPostsByPostId.totalCount > 0 && starOnPostsByPostId.totalCount}
    </Space>,
    <Space key="comments">
      <MessageOutlined />
      {commentCount > 0 && commentCount}
    </Space>,
  ];

  if (user?.username === sharedQuery.data?.currentUser?.username) {
    actions.push(
      <EditOutlined key="edit" />,
      <DeleteOutlined
        key="delete"
        onClick={() => {
          Modal.confirm({
            title: "Are you sure you want to delete this post?",
            icon: <ExclamationCircleOutlined />,
            onOk: async () =>
              deleteDesktop({
                variables: { desktopId: id },
              }),
          });
        }}
      />
    );
  }

  return (
    <List.Item
      key={id}
      actions={actions}
      extra={
        <a href={url} key={`${id}_${url}`}>
          <img src={url} style={{ maxHeight: "150px" }} />
        </a>
      }
    >
      <List.Item.Meta
        title={
          <Link href="/desktop/[slug]" as={`/desktop/${id}`}>
            <a>{title}</a>
          </Link>
        }
        description={
          <>
            <div>by {user?.username}</div>
            {!(tags && Array.isArray(tags))
              ? null
              : tags.map((tag) => <Tag key={`${id}_${tag}`}>{tag}</Tag>)}
          </>
        }
      />
    </List.Item>
  );
};
