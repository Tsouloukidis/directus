export default {
  id: "getdata",
  handler: (
    router,
    { services, exceptions, database, schema, logger, getSchema }
  ) => {
    const {
      ItemsService,
      MailService,
      UsersService,
      CollectionsService,
      AuthenticationService,
      AuthorizationService,
      FieldsService,
      PermissionsService,
      ActivityService,
    } = services;
    const { ServiceUnavailableException } = exceptions;

    router.post("/courses", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id } = req.body;
        let alldata = []
        database("courses")
          .where({
            team_id: team_id,
            owner: acountability.user,
          })
          .then((data) => {
            res.send(data);
            // alldata.push(data)
          })
          .catch((err) => {
            console.log(err);
          });
        // res.send(alldata)
      }
    });

    router.post("/lessons", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id } = req.body;

        database("lessons")
          .where({
            team_id: team_id,
            owner: acountability.user,
          })
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });

    router.post("/sessions", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id } = req.body;

        database("sessions")
          .where({
            team_id: team_id,
            owner: acountability.user,
          })
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });

    router.post("/tags", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id } = req.body;

        database("tags")
          .where({
            team_id: team_id,
          })
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })

    router.post("/packages", async (req, res) => {
      const acountability = req.accountability;

      if (
        !acountability.user ||
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { team_id } = req.body;

        const teams = new ItemsService("teams", {
          schema: req.schema,
        });

        const pack = new ItemsService("packages", {
          schema: req.schema,
        });
        if (team_id) {
          let team = await teams.readOne(team_id);
          let info = await pack.readOne(team.package);
          res.send(info);
        } else {
          res.send(null)
        }

      }
    });

    // router.post("/teams", async (req, res) => {
    //   const acountability = req.accountability;

    //   if (
    //     !acountability.user &&
    //     acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
    //   ) {
    //     res.send("you_do_not_have_access");
    //   } else {

    //     const teams = new ItemsService("teams", {
    //       schema: req.schema,
    //     });

    //     database("teams_directus_users").where({
    //       directus_users_id: acountability.user
    //     }).then(async (data) => {
    //       let index = data.findIndex((x) => x.directus_users_id === acountability.user)
    //       let team = await teams.readMany(data[index].teams_id)
    //       res.send(team)
    //     })
    //   }
    // });

    router.post("/getParticipants", async (req, res) => {
      const acountability = req.accountability;
      if (
        !acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2"
      ) {
        res.send("you_do_not_have_access");
      } else {
        const { pin } = req.body;

        database("Partcipant").where({
          room: pin
        }).then(data => {
          console.log(data)
          if (data.length > 0) {
            let obj = {
              partcipants: data
            };

            res.send(obj);
          }
        })
      }
    });

    router.post("/getInteractions", async (req, res) => {
      const acountability = req.accountability;
      const { session_id, pass } = req.body;
      const password = pass;
      if (password) {
        if (password !== "ngeiyltgxyijukdsaxgh") {
          res.send("you_do_not_have_access");
        } else {
          database("session_interactions").where({
            session_id: session_id
          }).then((data) => {
            res.send(data)
          })
        }
      } else if (!acountability.user &&
        acountability.role !== "6bbd5c06-ae83-4deb-9611-31a00feb4ce2") {
        res.send("you_do_not_have_access");
      } else {
        database("session_interactions").where({
          session_id: session_id
        }).then((data) => {
          res.send(data)
        })
      }
    });
  },
};
