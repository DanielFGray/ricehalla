import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  StarOutlined,
} from "@ant-design/icons"
import { SharedLayout, Stringify } from "@app/components";
import { useDeleteDesktopMutation,useDesktopListQuery, useSharedQuery } from "@app/graphql";
import { Button, List, Modal,Skeleton, Space, Tag } from "antd";
import { NextPage } from "next";
import Link from "next/link"
import * as React from "react";

const Home: NextPage = () => {
  const query = useSharedQuery();
  const { data, loading, error } = useDesktopListQuery();
  const [deleteDesktop] = useDeleteDesktopMutation();

  if (loading || !data) return <Skeleton />;
  if (error) return Stringify(error.message || error)
  if (!(data?.desktops?.nodes && Array.isArray(data.desktops.nodes))) return Stringify(data);
  console.log(data.desktops.nodes)
  return (
    <SharedLayout title="" query={query}>
      <Link href="/newpost"><Button type="primary">post new rice</Button></Link>
      <List itemLayout="vertical" size="large">
        {data.desktops.nodes.map(x => {
          const { id } = x
          const actions= [
            <Space key={`star_${id}`}><StarOutlined /></Space>,
            <Space key={`comments_{id}`}><MessageOutlined />{x.desktopCommentsByPostId.totalCount > 0 && x.desktopCommentsByPostId.totalCount}</Space>,
          ]
          if (x.user?.username === query.data?.currentUser?.username) {
            actions.push(
              <EditOutlined key={`edit_${id}`}/>,
              <DeleteOutlined
                key={`delete_${id}`}
                onClick={() => {
                  Modal.confirm({
                    title: "Are you sure you want to delete this post?",
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => deleteDesktop({ variables: { desktopId: id } }),
                  })
                }}
              />,
            )
          }
          return (
            <List.Item
              key={id}
              actions={actions}
              extra={
                <a href={x.url} key={`${id}_${x.url}`}>
                  <img src={x.url} style={{ maxHeight: "150px" }}/>
                </a>
              }
            >
              <List.Item.Meta
                title={<Link href="/desktop/[slug]" as={`/desktop/${x.id}`}><a>{x.title}</a></Link>}
                description={x.tags.length > 0 && (
                  <>
                    <div>
                      by {x.user?.username}
                    </div>
                    {x.tags.map(tag => <Tag.CheckableTag checked={false} key={`${id}_${tag}`}>{tag}</Tag.CheckableTag>)}
                  </>
                )}
              />
            </List.Item>
          )
        })}
      </List>
    </SharedLayout>
  );
};

export default Home;
