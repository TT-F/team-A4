import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { withStyles } from '@material-ui/styles';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import NotificationsIcon from '@material-ui/icons/Notifications';
import MenuList from './MenuList';
import AttendeeList from './AttendeeList';
import DraggableWhiteboard from './DraggableWhiteboard';
import DraggableVideo from './DraggableVideo';
import DraggableText from './DraggableText';
import DraggableWeb from './DraggableWeb';
import socket from "./SocketContext";

const drawerWidth = 240;
const DEFAULT_LOCATION = "0,0,600,500";

const styles = theme => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar, // TODO: uncomment this
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
});

class Room extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      open: false,
      components: [],
      users: props.location.state.data.user_name,
      contentTable: {},
      locationTable: {},
      imgSrcTable: {},
      userAvatars: props.location.state.data.user_avatar
    }

    console.log("props:", props);

    this.name = props.match.params.name;
    this.roomID = props.match.params.roomID;
    // TODO: room name
    
    socket.emit("join", { // join room when load this page
      "user_name": this.name,
      "room_id": this.roomID,
      // TODO: avatar传过去
    });

    // ! Should I put all these socket on in constructor ?
    socket.on("join_result", (joinResultData) => { // listen to any joining user
      if (joinResultData === "invalid input") {
        console.log("INVALID joinResultData");
      } else {
        this.setState({
          users: joinResultData.user_name,
          userAvatars: joinResultData.user_avatar
        });
        // TODO: setComponents, location, content
      }
    });

    socket.on("remove_user", (removeUserData) => { // listen to any leaving user
      if (typeof (removeUserData) == "object") {
        this.setState({
          users: removeUserData.user_name
        });
      } else {
        console.log("INVALID removeUserData");
      }
    });
    
    // socket.on("room_info", (roomInfoData) => { // TODO: Is this still useful?
    //   setUsers(roomInfoData.user_name);
    //   setUserAvatars(roomInfoData.user_avatar);
    // });

    socket.on("create_component", (createComponentData) => {
      let component_id = createComponentData.component_id;
      let component_type = createComponentData.component_type;
      let component_data = createComponentData.component_data;
      let key = [component_type, component_id].join(',');

      // TODO: these default value should investigated further. 
      // TODO: Try to print createComponentData out and see what's in there.
      let newComponents = [...this.state.components];
      newComponents.push(key);

      let newLocationTable = { ...this.state.locationTable };
      newLocationTable[component_id] = DEFAULT_LOCATION;
      
      let newContentTable = { ...this.state.contentTable };
      newContentTable[component_id] = component_data;
      
      this.setState({
        contentTable: newContentTable,
        locationTable: newLocationTable,
        components: newComponents
      });
    });

    socket.on("update_component", (data) => {
      let component_id = data.component_id;
      let update_info = data.update_info;

      let newContentTable = { ...this.state.contentTable };
      newContentTable[component_id] = update_info.data;

      let newLocationTable = { ...this.state.locationTable };
      newLocationTable[component_id] = update_info.location;

      let newImgSrcTable = { ...this.state.imgSrcTable };
      if (data.component_type === "whiteboard") {
        newImgSrcTable[component_id] = data.update_info.image_source
      }

      this.setState({
        locationTable: newLocationTable,
        contentTable: newContentTable,
        imgSrcTable: newImgSrcTable,
      });
    });

    socket.on("delete_component", (data) => {
      let component_type = data.component_type;
      let component_id = data.component_id;
      let key = [component_type, component_id].join(',');
      
      let newComponents = [...this.state.components];
      let index = newComponents.indexOf(key);
      newComponents.splice(index, 1);

      // TODO: test these hashtable delete
      let newLocationTable = {...this.state.locationTable};
      if (newLocationTable.component_id !== undefined) {
        delete newLocationTable.component_id;
      }
      
      let newContentTable = {...this.state.contentTable};
      if (newContentTable.component_id !== undefined) {
        delete newContentTable.component_id;
      }
      
      let newImgSrcTable = {...this.state.contentTable};
      if (component_type === "whiteboard" && newImgSrcTable.component_id !== undefined) {
        delete newImgSrcTable.component_id;
      }

      this.setState({
        components: newComponents,
        locationTable: newLocationTable,
        contentTable: newContentTable,
        imgSrcTable: newImgSrcTable,
      });
    });
  }

  handleDrawerOpen = () => this.setState({ open: true });

  handleDrawerClose = () => this.setState({ open: false });

  handleAddComponent = (type) => {
    // TODO: In handleDeleteComponent, we removed it from conponents list first.
    // TODO: Should we do the same here?
    // TODO: set up contentTable, locationTable, imgSrcTable ?? default value ??
    socket.emit("create_component", {
      "room_id": this.roomID,
      "component_type": type
    });
  }

  handleDeleteComponent = (key) => {
    // TODO: delete item from contentTable and locationTable (although it has no effect in demo)
    let parseObjects = key.split(",");
    let type = parseObjects[0];
    let component_id = parseObjects[1];
    socket.emit("delete_component", {
      "room_id": this.roomID,
      "component_id": component_id,
      "component_type": type
    });
  }

  handleValueChange = (key, value, imgSrc) => { // TODO: the imgSrc might cause issue
    let component_type = key.split(',')[0];
    let component_id = key.split(',')[1];

    socket.emit("update_component", {
      "room_id": this.roomID,
      "component_id": component_id,
      "component_type": component_type,
      "update_type": "update_finished",
      "update_info": {
        "location": this.state.locationTable[component_id],
        "data": value,
        "image_source": component_type === "whiteboard" ? imgSrc : "" // for whiteboard, include image source field
      }
    });
  }

  handleLocationChange = (key, x, y, width, height) => {
    let location = [x, y, width, height].join(',');
    let component_type = key.split(',')[0];
    let component_id = key.split(',')[1];

    socket.emit("update_component", {
      "room_id": this.state.roomID,
      "component_id": component_id,
      "component_type": component_type,
      "update_type": "update_finished",
      "update_info": {
        "location": location,
        "data": this.state.contentTable[component_id]
      }
    });
  }

  // Listen to any updates on create components
  // TODO: I do think we can refactor this part
  userSetAvatar = (e) => {
    socket.emit("change_avatar", {
      "room_id": this.roomID,
      "user_name": this.name,
      "user_avatar": e
    });
  }

  render() {
    console.log("this.props.location.state.data:", this.props.location.state.data);

    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="absolute" className={clsx(classes.appBar, this.state.open && classes.appBarShift)}>
          <Toolbar className={classes.toolbar}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={this.handleDrawerOpen}
              className={clsx(classes.menuButton, this.state.open && classes.menuButtonHidden)}
            >
              <MenuIcon />
            </IconButton>
            <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
              Room {this.roomName}
            </Typography>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          classes={{
            paper: clsx(classes.drawerPaper, !this.state.open && classes.drawerPaperClose),
          }}
          open={this.state.open}
        >
          <div className={classes.toolbarIcon}>
            <IconButton onClick={this.handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <MenuList handleAddComponent={this.handleAddComponent} roomID={this.roomID} />
          <Divider />
          <AttendeeList
            attendees={this.state.users}
            userSetAvatar={this.userSetAvatar}
            userAvatars={this.state.userAvatars}
            currentUser={this.name}
          />
        </Drawer>
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Container maxWidth="lg" className={classes.container}>
            <Grid>
              {this.state.components.map((key) => {
                let componentType = key.split(',')[0];
                let componentId = key.split(',')[1];
                switch (componentType) {
                  case 'video':
                    return (
                      <DraggableVideo
                        key={key}
                        k={key}
                        roomID={this.roomID}
                        componentId={componentId}
                        value={this.state.contentTable[componentId]}
                        location={this.state.locationTable[componentId]}
                        handleDeleteComponent={this.handleDeleteComponent}
                        handleValueChange={this.handleValueChange}
                        handleLocationChange={this.handleLocationChange}
                      />);
                  case 'text':
                    return (
                      <DraggableText
                        key={key}
                        k={key}
                        roomID={this.roomID}
                        componentId={componentId}
                        value={this.state.contentTable[componentId]}
                        location={this.state.locationTable[componentId]}
                        handleDeleteComponent={this.handleDeleteComponent}
                        handleValueChange={this.handleValueChange}
                        handleLocationChange={this.handleLocationChange}
                      />
                    );
                  case 'whiteboard':
                    return (
                      <DraggableWhiteboard
                        key={key}
                        k={key}
                        roomID={this.roomID}
                        componentId={componentId}
                        value={this.state.contentTable[componentId]}
                        imgSrc={this.state.imgSrcTable[componentId]}
                        location={this.state.locationTable[componentId]}
                        handleDeleteComponent={this.handleDeleteComponent}
                        handleValueChange={this.handleValueChange}
                        handleLocationChange={this.handleLocationChange}
                      />
                    );
                  case 'web':
                    return (
                      <DraggableWeb
                        key={key}
                        k={key}
                        roomID={this.roomID}
                        componentId={componentId}
                        value={this.state.contentTable[componentId]}
                        location={this.state.locationTable[componentId]}
                        handleDeleteComponent={this.handleDeleteComponent}
                        handleValueChange={this.handleValueChange}
                        handleLocationChange={this.handleLocationChange}
                      />
                    );
                }
              })}
            </Grid>
          </Container>
        </main>
      </div>
    );
  }
}

Room.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Room); // TODO: unsure about this
