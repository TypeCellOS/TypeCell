import { ButtonGroup, LoadingButton } from "@atlaskit/button";
import Form, {
  ErrorMessage,
  Field,
  FormFooter,
  FormHeader,
  HelperMessage,
} from "@atlaskit/form";
import TextField from "@atlaskit/textfield";
import { observer } from "mobx-react-lite";
import { Fragment } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoreService } from "../../../store/local/stores";
import { Logo } from "../../main/components/Logo";
import { SupabaseSessionStore } from "../SupabaseSessionStore";
import AuthStyles from "./AuthStyles.module.css";

export const Username = observer((props: {}) => {
  const { sessionStore } = getStoreService();

  if (!(sessionStore instanceof SupabaseSessionStore)) {
    throw new Error("sessionStore is not a SupabaseSessionStore");
  }

  // const usernameRef = React.useRef<HTMLInputElement>(null);

  const location = useLocation();
  //   const navigate = useNavigate();

  const onSubmit = async (data: { username: string }) => {
    // const username = usernameRef.current?.value;
    try {
      if (data.username) {
        await sessionStore.setUsername(data.username);
      }
    } catch (e) {
      return {
        username: "unknown-error",
      };
    }
  };

  const from = (location.state as any)?.from?.pathname || "/";
  //   let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  return (
    <div className={AuthStyles.AuthPage}>
      <div className={AuthStyles.AuthHeader}>
        <div className={AuthStyles.AuthHeaderLogo}>
          <Logo></Logo>
        </div>
      </div>
      <div className={AuthStyles.AuthBody}>
        <div className={AuthStyles.AuthForm}>
          {/* <p>Please pick a username:</p>
          <input type="text" ref={usernameRef} />
          <Button appearance="primary" onClick={setUsername}>
            Continue
          </Button> */}

          <Form<{ username: string }> onSubmit={onSubmit}>
            {({ formProps, submitting }) => (
              <form {...formProps}>
                <FormHeader title="Welcome">
                  <p>
                    Welcome to TypeCell! What username would you like to use?
                  </p>
                </FormHeader>
                <Field
                  name="username"
                  label="Username"
                  isRequired
                  defaultValue="">
                  {({ fieldProps, error }) => (
                    <Fragment>
                      <TextField autoComplete="off" {...fieldProps} />
                      {!error && (
                        <HelperMessage>
                          You can use letters and numbers
                        </HelperMessage>
                      )}
                      {error && (
                        <ErrorMessage>
                          This username is already in use, try another one.
                        </ErrorMessage>
                      )}
                    </Fragment>
                  )}
                </Field>
                <FormFooter>
                  <ButtonGroup>
                    {/* <Button appearance="subtle">Cancel</Button> */}
                    <LoadingButton
                      type="submit"
                      appearance="primary"
                      isLoading={submitting}>
                      Continue
                    </LoadingButton>
                  </ButtonGroup>
                </FormFooter>
              </form>
            )}
          </Form>

          {/* <input type="submit" onClick={setUsername} /> */}
          {/* <div className={AuthStyles.AuthFormFooter}>sdfsdf</div> */}
        </div>
      </div>
      <div className={AuthStyles.AuthFooter}>
        {/* <HelperMessage>Powered by Matrix</HelperMessage> */}
      </div>
    </div>
  );
});
