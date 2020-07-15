import { AuthRestrict, SharedLayout } from "@app/components";
import {
  DesktopListDocument,
  DesktopListQueryResult,
  useCreateDesktopMutation,
  useSharedQuery,
} from "@app/graphql";
import {
  extractError,
  formItemLayout,
  getCodeFromError,
  getExceptionFromError,
  tailFormItemLayout,
} from "@app/lib";
import { Alert, Button, Form, Input, Select } from "antd";
import { ApolloError } from "apollo-client";
import { NextPage } from "next";
import Router from "next/router";
import { Store } from "rc-field-form/lib/interface";
import React, { useCallback, useEffect, useRef, useState } from "react";

const NewPost: NextPage = () => {
  const [error, setError] = useState<Error | ApolloError | null>(null);
  const query = useSharedQuery();
  const [post] = useCreateDesktopMutation();
  const [form] = Form.useForm();

  const handleValuesChange = useCallback((changedValues) => {
    // TODO: test url doesn't 404?
  }, []);

  const handleSubmit = useCallback(
    async (values: Store) => {
      console.log(values);
      try {
        await post({
          variables: {
            title: values.title,
            url: values.url,
            description: values.description,
            tags: values.tags,
          },
          update: (proxy, result) => {
            const cache = proxy.readQuery<DesktopListQueryResult>({
              query: DesktopListDocument,
            });
            console.log(cache, result);
            // const DesktopList = [
            //   result?.data.DesktopCreate,
            //   ...cache?.DesktopList,
            // ]
            // proxy.writeQuery({
            //   query: DesktopListDocument,
            //   data: { DesktopList },
            // })
            Router.push("/");
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
    [form, post]
  );

  const focusElement = useRef<Input>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);
  return (
    <SharedLayout
      title="New Post"
      query={query}
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <Form
        {...formItemLayout}
        form={form}
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          label={<span>Title</span>}
          name="title"
          rules={[
            {
              required: true,
              message: "Please input your title.",
              whitespace: true,
            },
            {
              min: 1,
              message: "Title must not be empty",
            },
          ]}
        >
          <Input autoComplete="title" data-cy="postrice-input-title" />
        </Form.Item>
        <Form.Item
          label={<span>URL</span>}
          name="url"
          rules={[
            {
              required: true,
              message: "Please enter a URL",
              whitespace: false,
            },
            {
              min: 1,
              message: "URL must not be empty",
            },
          ]}
        >
          <Input autoComplete="url" data-cy="postrice-input-url" />
        </Form.Item>
        <Form.Item label={<span>Description</span>} name="description">
          <Input.TextArea rows={5} />
        </Form.Item>
        <Form.Item label="Tags" name="tags" rules={[]}>
          <Select
            showArrow
            mode="tags"
            style={{ width: "100%" }}
            placeholder="enter tags"
          />
        </Form.Item>
        {error ? (
          <Form.Item label="Error">
            <Alert
              type="error"
              message="Post failed"
              description={
                <span>
                  {extractError(error).message}
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
        <Form.Item {...tailFormItemLayout}>
          <Button htmlType="submit" data-cy="postrice-submit-button">
            Post
          </Button>
        </Form.Item>
      </Form>
    </SharedLayout>
  );
};

export default NewPost;
