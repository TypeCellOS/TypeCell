# setup database

CREATE DATABASE "synapse" WITH OWNER = "doadmin" LC_COLLATE = 'C' LC_CTYPE='C' TEMPLATE template0;

# create config files

`docker-compose run --rm -e SYNAPSE_SERVER_NAME=typecell.org -e SYNAPSE_REPORT_STATS=no synapse generate`

Modify `homeserver.yaml`

- Add postgres database
- set enable_registration: true
- set enable_search: false
- set allow_guest_access: true
- add github / google oidc providers (https://github.com/matrix-org/synapse/blob/master/docs/openid.md)
- set public_baseurl: https://mx.typecell.org
- set registrations_require_3pid to "email"
- Set SMTP server settings (from sendgrid)

# setup server

- mount volume on /data
- copy files in /data, set password
- copy docker-compose.yml to ~ directory
- run `docker-compose up -d`
- setup ufw to loadbalancer (TODO)

# logging

- chmod homeserver.log? not working yet
